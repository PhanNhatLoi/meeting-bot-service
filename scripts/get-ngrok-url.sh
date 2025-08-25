#!/bin/bash

sleep 3
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$NGROK_URL" ]; then
    echo "🌐 Ngrok URL: $NGROK_URL"
else
    echo "⚠️  Could not get start ngrok URL. Check /tmp/ngrok.log"
fi