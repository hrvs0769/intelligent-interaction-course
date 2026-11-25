#!/bin/bash
# 《智能交互与设计》课程网站 · 一键启动
# 双击此文件即可在浏览器中打开课程网站。
cd "$(dirname "$0")" || exit 1

PORT=8080
while lsof -i :$PORT >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

echo "正在启动课程网站……"
python3 -m http.server $PORT >/dev/null 2>&1 &
SERVER_PID=$!
sleep 1
open "http://localhost:$PORT"
echo ""
echo "课程网站已启动：http://localhost:$PORT"
echo "关闭此终端窗口即可停止本地服务。"
wait $SERVER_PID
