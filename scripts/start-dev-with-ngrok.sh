#!/bin/bash

echo "🚀 Starting ngrok tunnel..."
ngrok http 8911 &
NGROK_PID=$!

echo "⏳ Waiting for ngrok..."
sleep 3

# Lấy và hiển thị ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$NGROK_URL" ]; then
    echo "✅ Ngrok tunnel started!"
    echo "🌐 Public URL: $NGROK_URL"
    echo "🔗 Local URL: http://localhost:8911"
    echo ""
else
    echo "⚠️  Could not get ngrok URL"
fi

echo "🚀 Starting NestJS app..."
npm run start:dev

# Cleanup
kill $NGROK_PID 2>/dev/null 