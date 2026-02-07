#!/bin/bash

# BaseGuardian Dashboard
# Shows live stats and recent activity

while true; do
  clear
  echo "🛡️  BaseGuardian - Live Dashboard"
  echo "=================================="
  date
  echo ""

  # Agent status
  if pgrep -f "tsx src/index.ts" > /dev/null; then
    echo "🟢 Agent Status: RUNNING"
    UPTIME=$(ps -p $(pgrep -f "tsx src/index.ts" | head -1) -o etime= 2>/dev/null || echo "N/A")
    echo "⏱️  Uptime: $UPTIME"
  else
    echo "🔴 Agent Status: STOPPED"
  fi

  echo ""

  # Blockchain status
  BLOCK=$(curl -s http://localhost:3000/health 2>/dev/null | jq -r '.blockchain.currentBlock // "N/A"')
  echo "⛓️  Current Block: $BLOCK"

  # Wallet balance
  BALANCE=$(curl -s http://localhost:3000/health 2>/dev/null | jq -r '.wallet.balanceEth // "N/A"')
  echo "💰 Wallet Balance: $BALANCE ETH"

  echo ""
  echo "📊 Database Stats:"

  # Run the database check
  npx tsx check_db.ts 2>/dev/null | grep -A 10 "Today's Statistics"

  echo ""
  echo "📝 Recent Activity (last 5 events):"
  tail -5 data/logs/agent.log | while read line; do
    msg=$(echo "$line" | jq -r '.message // empty' 2>/dev/null)
    ts=$(echo "$line" | jq -r '.timestamp // empty' 2>/dev/null | cut -d'T' -f2 | cut -d'.' -f1)
    if [ -n "$msg" ]; then
      echo "  [$ts] $msg"
    fi
  done

  echo ""
  echo "Press Ctrl+C to exit | Refreshing every 5 seconds..."

  sleep 5
done
