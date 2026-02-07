#!/bin/bash

# BaseGuardian Real-time Monitor
# Shows only important events (contracts, analyses, alerts)

echo "🛡️  BaseGuardian - Real-time Monitor"
echo "===================================="
echo ""
echo "Watching for:"
echo "  🔍 New contract deployments"
echo "  🤖 AI analyses"
echo "  🚨 Scam alerts"
echo "  ✅ Certifications"
echo "  🐦 Twitter posts"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "------------------------------------"
echo ""

# Follow the log and filter for important events
tail -f data/logs/agent.log | while read line; do
  # Check for important keywords
  if echo "$line" | grep -qi "contract\|deployment\|scam\|safe\|analysis\|certification\|twitter\|posted\|alert"; then
    # Pretty print with colors
    timestamp=$(echo "$line" | jq -r '.timestamp // empty' 2>/dev/null)
    message=$(echo "$line" | jq -r '.message // empty' 2>/dev/null)
    level=$(echo "$line" | jq -r '.level // empty' 2>/dev/null)

    if [ -n "$message" ]; then
      case "$level" in
        error)
          echo "❌ [$timestamp] $message"
          ;;
        warn)
          echo "⚠️  [$timestamp] $message"
          ;;
        *)
          echo "ℹ️  [$timestamp] $message"
          ;;
      esac
    fi
  fi
done
