---
description: naoki-blueprint で新しい動画プロジェクトを作る（別ターミナル自動起動・OS自動判定）
allowed-tools: Bash
---

naoki-blueprint で新しい動画プロジェクトを作ります。

現在の Claude Code セッションは既存プロジェクト（`projects/XXX/`）内で動いているため、ここで直接 `bash 新規作成.sh` を実行すると cwd 問題で事故ります。**新しいターミナルウィンドウを自動起動**して、そこで `新規作成.sh` を走らせます。OS を自動判定して適切なコマンドを使います（macOS / Windows / Linux 対応）。

以下を Bash で実行してください:

```bash
# naoki-blueprint 本体の絶対パスを取得（現在の cwd は projects/XXX のはず）
ROOT=$(cd "$(pwd)/../.." && pwd)

# OS 判定して新ターミナルを起動
case "$(uname -s)" in
  Darwin*)
    # macOS
    osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT' && bash 新規作成.sh\""
    osascript -e 'tell application "Terminal" to activate'
    echo "✅ 新しい Terminal.app ウィンドウを起動しました。そちらで続けてください。"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    # Windows (Git Bash / MSYS)
    if command -v wt.exe >/dev/null 2>&1; then
      # Windows Terminal がある場合
      wt.exe bash -c "cd '$ROOT' && bash 新規作成.sh; exec bash"
      echo "✅ 新しい Windows Terminal ウィンドウを起動しました。そちらで続けてください。"
    else
      # Git Bash を start で起動
      cmd.exe //c start "" bash -c "cd '$ROOT' && bash 新規作成.sh; exec bash"
      echo "✅ 新しい Git Bash ウィンドウを起動しました。そちらで続けてください。"
    fi
    ;;
  Linux*)
    # Linux
    if command -v gnome-terminal >/dev/null 2>&1; then
      gnome-terminal -- bash -c "cd '$ROOT' && bash 新規作成.sh; exec bash"
      echo "✅ 新しい GNOME Terminal を起動しました。"
    elif command -v xterm >/dev/null 2>&1; then
      xterm -e "cd '$ROOT' && bash 新規作成.sh; exec bash" &
      echo "✅ 新しい xterm を起動しました。"
    else
      echo "⚠️ 自動起動できませんでした。通常ターミナルで以下を実行してください:"
      echo "   cd '$ROOT' && bash 新規作成.sh"
    fi
    ;;
  *)
    echo "⚠️ このOSは自動起動未対応です。通常ターミナルで以下を実行してください:"
    echo "   cd '$ROOT' && bash 新規作成.sh"
    ;;
esac
```

実行後、開いた新しいターミナルウィンドウで:
1. プロジェクト名を入力（例: `tennis-serve-tips`）
2. 動画タイプを選択（1=横動画 / 2=ショート動画）
3. 作成完了後、末尾の案内通りに:
   ```
   cd (表示されたパス)
   claude --dangerously-skip-permissions
   ```
   で新しく Claude Code を起動し、そちらで `/step01-context` から作業開始。

現在のこの Claude Code セッションはそのまま作業継続しても閉じてもOK（新プロジェクト用のセッションは別で起動されます）。
