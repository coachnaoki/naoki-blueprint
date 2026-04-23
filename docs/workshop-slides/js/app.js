(() => {
  const canvas = document.getElementById('canvas');
  const stage = document.getElementById('stage');
  const pageCounter = document.getElementById('pageCounter');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarHoverZone = document.getElementById('sidebarHoverZone');
  const sidebarList = document.getElementById('sidebarList');

  const factories = window.slideFactories || [];
  const agendaItems = window.agendaItems || [];

  // Render all slides
  canvas.innerHTML = factories.map((f) => f()).join('');
  const slideEls = Array.from(canvas.querySelectorAll('.slide'));

  // Animation palette
  const ANIMS = [
    'anim-fade-up', 'anim-fade-down', 'anim-slide-left', 'anim-slide-right',
    'anim-scale-in', 'anim-blur-in', 'anim-rotate-in', 'anim-reveal'
  ];
  slideEls.forEach((el, i) => {
    if (el.hasAttribute('data-anim-fixed')) return;
    const pick = ANIMS[(i * 3 + 1) % ANIMS.length];
    el.classList.add(pick);
  });

  // Build sidebar
  agendaItems.forEach((item, i) => {
    const li = document.createElement('li');
    li.dataset.index = i;
    const btn = document.createElement('button');
    btn.textContent = String(i + 1).padStart(2, '0') + ' ' + item.label;
    btn.addEventListener('click', () => { goTo(i); closeSidebar(); });
    li.appendChild(btn);
    sidebarList.appendChild(li);
  });

  // Sidebar open/close
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  }
  sidebarHoverZone.addEventListener('mouseenter', openSidebar);
  sidebar.addEventListener('mouseleave', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Scaling: canvas を 100vw x 100vh とし、各 .slide を scale + 中央配置
  function fitCanvas() {
    const w = window.innerWidth, h = window.innerHeight;
    const scale = Math.min(w / 1920, h / 1080);
    const offsetX = (w - 1920 * scale) / 2;
    const offsetY = (h - 1080 * scale) / 2;
    slideEls.forEach(el => {
      el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    });
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  // コードブロック先頭の改行・空白を除去（HTML内のインデント対策）
  canvas.querySelectorAll('.code').forEach(el => {
    if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) {
      el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, '');
    }
    if (el.lastChild && el.lastChild.nodeType === Node.TEXT_NODE) {
      el.lastChild.textContent = el.lastChild.textContent.replace(/\s+$/, '');
    }
  });

  // Navigation
  let current = 0;
  function getSlide(i) {
    if (i < 0 || i >= slideEls.length) return null;
    return {
      el: slideEls[i],
      notes: slideEls[i].dataset.notes || ''
    };
  }

  function render() {
    slideEls.forEach((el, i) => {
      el.classList.toggle('active', i === current);
    });
    pageCounter.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(slideEls.length).padStart(2, '0');
    Array.from(sidebarList.children).forEach((li, i) => {
      li.classList.toggle('active', i === current);
    });
    // Regenerate QR if slide contains qr target
    renderQRIfNeeded();
    broadcastState();
  }

  function go(step) {
    const next = Math.max(0, Math.min(slideEls.length - 1, current + step));
    if (next === current) return;
    current = next; render();
  }
  function goTo(i) {
    if (i < 0 || i >= slideEls.length) return;
    current = i; render();
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { goTo(0); }
    else if (e.key === 'End') { goTo(slideEls.length - 1); }
    else if (e.key === 'p' || e.key === 'P') { openPresenter(); }
  });

  // QR generation (one time per slide show)
  function renderQRIfNeeded() {
    const target = slideEls[current].querySelector('.qr-box[data-qr]');
    if (!target) return;
    if (target.dataset.generated === '1') return;
    const url = target.dataset.qr;
    target.innerHTML = '';
    QRCode.toCanvas(document.createElement('canvas'), url, {
      margin: 0, width: 360,
      color: { dark: '#23221e', light: '#ffffff' }
    }, (err, c) => {
      if (err) { target.textContent = 'QR生成エラー'; return; }
      target.appendChild(c);
      target.dataset.generated = '1';
    });
  }

  // === Presenter Integration ===
  const PRESENTER_CHANNEL = 'naoki-blueprint-workshop-presenter';
  const channel = new BroadcastChannel(PRESENTER_CHANNEL);
  let presenterWin = null;

  function broadcastState() {
    const data = getSlide(current);
    if (!data) return;
    channel.postMessage({
      type: 'state',
      index: current,
      total: slideEls.length,
      notes: data.notes || '',
      label: 'Slide ' + String(current + 1).padStart(2, '0')
    });
  }

  channel.onmessage = (e) => {
    const data = e.data;
    if (!data) return;
    if (data.type === 'hello') broadcastState();
    else if (data.type === 'key') {
      if (data.key === 'ArrowRight' || data.key === ' ' || data.key === 'PageDown') go(1);
      else if (data.key === 'ArrowLeft' || data.key === 'PageUp') go(-1);
    }
    else if (data.type === 'goTo' && typeof data.index === 'number') goTo(data.index);
  };
  setInterval(() => channel.postMessage({ type: 'heartbeat' }), 1500);

  function openPresenter() {
    const features = 'width=1100,height=720,menubar=no,toolbar=no,location=no,status=no';
    presenterWin = window.open('presenter.html', 'slidePresenter', features);
    if (presenterWin) presenterWin.focus();
  }
  document.getElementById('presenterBtn').addEventListener('click', openPresenter);

  // First render
  render();
})();
