#!/bin/bash

URL_FILE="cloudflared-url.txt"

if [ -f "$URL_FILE" ]; then
    echo "🌐 Cloudflared URL:"
    cat "$URL_FILE"
    echo ""
    echo "💡 Copy this URL for webhooks"
else
    echo "⚠️  No URL file found"
    echo "💡 Run: npm run start:dev:cloudflared"
fi 