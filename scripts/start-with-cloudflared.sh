#!/bin/bash

echo "🚀 Starting cloudflared tunnel..."

# Tạo file log tạm thời
LOG_FILE=$(mktemp)
URL_FILE="cloudflared-url.txt"

# Xóa file URL cũ nếu có
rm -f "$URL_FILE"

# Khởi động cloudflared và capture output
cloudflared tunnel --url http://localhost:8911 > "$LOG_FILE" 2>&1 &
CLOUDFLARED_PID=$!

echo "⏳ Waiting for cloudflared..."
sleep 8

# Tìm URL trong log file
CLOUDFLARED_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' "$LOG_FILE" | head -1)

if [ -n "$CLOUDFLARED_URL" ]; then
    echo "✅ Cloudflared tunnel started!"
    echo "🌐 Public URL: $CLOUDFLARED_URL"
    echo "🔗 Local URL: http://localhost:8911"
    echo ""
    echo "💡 COPY THIS URL: $CLOUDFLARED_URL"
    echo "📋 URL saved to: $URL_FILE"
    
    # Lưu URL vào file
    echo "$CLOUDFLARED_URL" > "$URL_FILE"
    echo ""
else
    echo "⚠️  Could not get cloudflared URL"
    echo "📋 Recent logs:"
    tail -10 "$LOG_FILE"
fi

echo "🚀 Starting NestJS app..."
npm run start:dev

# Cleanup
kill $CLOUDFLARED_PID 2>/dev/null
rm -f "$LOG_FILE" 