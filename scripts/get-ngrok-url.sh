#!/bin/bash

# chạy ngrok từ root
/ngrok http 3000 > /dev/null 2>&1 &

sleep 3

URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*')

echo "Public URL: $URL"