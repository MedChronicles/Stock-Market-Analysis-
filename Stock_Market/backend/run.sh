#!/bin/bash

# Stock Trading Matching Engine Runner Script

echo "╔════════════════════════════════════════════════╗"
echo "║     STOCK TRADING MATCHING ENGINE RUNNER      ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if compiled
if [ ! -f "matching_engine" ]; then
    echo "⚙️  Compiling matching engine..."
    make
    if [ $? -ne 0 ]; then
        echo "❌ Compilation failed!"
        exit 1
    fi
    echo ""
fi

# Check if data directory exists
if [ ! -d "data" ]; then
    echo "❌ Error: data/ directory not found!"
    echo "Please ensure data/orders.csv exists"
    exit 1
fi

# Check if orders.csv exists
if [ ! -f "data/orders.csv" ]; then
    echo "❌ Error: data/orders.csv not found!"
    exit 1
fi

# Backup existing trades.csv if it exists
if [ -f "data/trades.csv" ]; then
    timestamp=$(date +%Y%m%d_%H%M%S)
    cp data/trades.csv "data/trades_backup_${timestamp}.csv"
    echo "💾 Backed up previous trades to trades_backup_${timestamp}.csv"
    echo ""
fi

# Run the matching engine
echo "🚀 Running matching engine..."
echo ""
./matching_engine

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║            ✅ EXECUTION SUCCESSFUL             ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "📄 Check data/trades.csv for matched trades"
else
    echo ""
    echo "❌ Execution failed!"
    exit 1
fi
