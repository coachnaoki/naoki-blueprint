# 言い直し検出アルゴリズム（詳細）

step05 の言い直し検出で使う4つのパターンとその実装。

## パターン1〜3: N-gram自動検出（同一フレーズの繰り返し・文中断・フィラー挟み）

**ハードコード禁止。以下のアルゴリズムで自動検出する。**

10文字以上のN-gramで、同じ文字列が2回以上登場し、かつ時刻差が30秒以内のものを言い直し候補とする。

```python
import json

# Phase 1の無音区間を取得済みの前提（silences）
orig = json.load(open('public/transcript_words.original.json'))['words']
text = ''.join(w['word'].replace(' ','') for w in orig)

def time_at(char_p):
    c = 0
    for w in orig:
        wl = len(w['word'].replace(' ',''))
        if c + wl > char_p: return w['start']
        c += wl
    return orig[-1]['end']

# N=10〜19文字のN-gramで2回以上登場するものを収集
candidates = {}
for n in range(10, 20):
    for i in range(len(text) - n + 1):
        phrase = text[i:i+n]
        if any(c in phrase for c in '。、！？'): continue  # 句読点跨ぎは除外
        candidates.setdefault(phrase, []).append(i)

# 2回以上登場 + 時刻差30秒以内
dup_phrases = []
for phrase, positions in candidates.items():
    if len(positions) < 2: continue
    t1 = time_at(positions[0])
    t2 = time_at(positions[1])
    if t2 - t1 > 30: continue  # 30秒超は意図的な繰り返しの可能性
    dup_phrases.append((phrase, t1, t2))

# オーバーラップ除去（長いフレーズを優先）
dup_phrases.sort(key=lambda x: -len(x[0]))
def overlaps(a, b):
    return not (a[1] < b[0] - 0.1 or b[1] < a[0] - 0.1)
phrase_retakes = []
for p, t1, t2 in dup_phrases:
    cut = (t1, t2)
    if any(overlaps(cut, s_cut) for s_cut, _ in phrase_retakes): continue
    phrase_retakes.append((cut, p))

print(f"重複フレーズ検出: {len(phrase_retakes)}件")
```

**なぜ最小10文字か**: 短いフレーズ（「ポジショニング」等8文字）は正文でも偶然2回登場しやすく誤検出になる。10文字以上なら偶然の一致はほぼ発生しない。

**なぜ時刻差30秒以内か**: 30秒超で同じフレーズが登場する場合、セクション区切りや意図的な繰り返しの可能性が高い。言い直しは通常5〜20秒以内。

## パターン4: Whisperが隠した言い直し（重要）

Whisperは言い直し部分を1つの単語に統合することがある。**1〜2文字のワードでduration（end - start）が0.7秒以上の場合、言い直しが隠れている可能性が高い。**

例:「悩み…悩みを」→ Whisperが「み」を2.1秒の1ワードに統合。「前衛のポ…前衛のポーチと」→「ポ」を1.94秒に統合。

検出方法:
```python
# 必ず .original.json から検出する
import json
orig = json.load(open('public/transcript_words.original.json'))['words']
# 1〜2文字で0.7秒以上のワードを検出
hidden_retakes = [(i, w) for i, w in enumerate(orig) if len(w['word'].strip()) <= 2 and (w['end'] - w['start']) >= 0.7]
print(f'隠れ言い直し: {len(hidden_retakes)}件')
```

**⚠️ 検出された全件をループで処理する（必須）。**
1件だけ処理するなどのハードコード禁止。

## 隠れ言い直しのカット範囲自動拡張（必須）

隠れ言い直しが見つかった場合、単語そのものだけでなく**話者が戻った地点まで**カット範囲を拡張する必要がある。

**アルゴリズム**:
1. 隠れ言い直しワード内の無音区間 **S1** を特定（Phase 1のsilencedetect結果から）
2. 隠れ言い直しワードより**前の直近の無音区間 S0** を探す
3. **S0の開始時刻以降で最初に始まるワード** → カット開始点
4. **S1の終了時刻** → カット終了点

```
例1: 「あなたもこんな悩み」の隠れ言い直し
  - 隠れ言い直し: 「み」83.30-85.40s（2.1秒）
  - S1（中の無音）: 83.57-84.16s
  - S0（前の無音）: 81.27-82.04s
  - S0後の最初のワード: 「あ(なた)」81.72s
  → カット範囲: 81.72 → 84.16s（「あなたもこんな悩み」1回目まるごと）

例2: 「前衛のポ」の隠れ言い直し
  - 隠れ言い直し: 「ポ」108.86-110.80s（1.94秒）
  - S1（中の無音）: 109.15-109.96s
  - S0（前の無音）: 107.76-108.23s
  - S0後の最初のワード: 「全(=前衛)」108.06s
  → カット範囲: 108.06 → 109.96s（「前衛のポ」1回目まるごと）
```

**なぜ前の無音まで戻るのか**: 話者は言い直す時、直前の句や節の先頭まで戻ることが多い。その戻り地点は直前の無音（息継ぎ・間）の直後と一致する。
