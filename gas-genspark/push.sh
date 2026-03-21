#!/bin/bash
cd /Users/kobayashinaoki/Desktop/7_AI/Cursor/gas-genspark
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes" git add slides.html
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes" git commit -m "update slides" 2>/dev/null || echo "変更なし"
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes" git push
echo "完了しました"
