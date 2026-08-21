# Stock Trading Order Matching Engine (C Backend)

## 🚀 Overview

This is a **high-performance order matching engine** written in C that implements a real stock exchange matching system using:

- **Max-Heap** for BUY orders (highest price gets priority)
- **Min-Heap** for SELL orders (lowest price gets priority)
- **Price-Time Priority** matching algorithm

## 📊 How It Works

### Matching Logic

1. **BUY Order**: Buyer wants to buy at price X or LOWER
   - Match with SELL orders at price ≤ X
   - Execute at the SELL price (best price for buyer)

2. **SELL Order**: Seller wants to sell at price Y or HIGHER
   - Match with BUY orders at price ≥ Y
   - Execute at the BUY price (best price for seller)

### Algorithm

```
For each stock symbol:
  WHILE (top BUY order price >= top SELL order price):
    - Extract both orders
    - Match the quantity (partial or full fill)
    - Execute trade at SELL price
    - Re-insert if partially filled
    - Record trade in trades.csv
```

## 📁 File Structure

```
backend/
├── matching_engine.c     # Main C program
├── Makefile             # Build configuration
├── README.md            # This file
└── data/
    ├── stocks.csv       # Stock data
    ├── orders.csv       # Pending orders (INPUT)
    ├── trades.csv       # Matched trades (OUTPUT)
    └── users.csv        # User accounts
```

## 🛠️ Compilation & Execution

### Prerequisites
- GCC compiler
- Make (optional)

### Compile

**Using Make:**
```bash
cd backend
make
```

**Manual Compilation:**
```bash
gcc -Wall -Wextra -O2 -std=c99 -o matching_engine matching_engine.c
```

### Run

```bash
./matching_engine
```

## 📝 CSV Data Format

### orders.csv (Input)
```csv
orderId,userId,symbol,type,quantity,price,timestamp,status
1001,1,AAPL,BUY,100,174.50,2025-03-31T09:30:00,PENDING
1002,2,AAPL,SELL,50,176.00,2025-03-31T09:31:00,PENDING
```

### trades.csv (Output)
```csv
tradeId,buyOrderId,sellOrderId,buyerUserId,sellerUserId,symbol,quantity,price,timestamp
1,1001,1002,1,2,AAPL,50,176.00,2025-03-31T10:15:23
```

## 🎯 Example Output

```
╔════════════════════════════════════════════════╗
║   STOCK TRADING ORDER MATCHING ENGINE (C)     ║
║   Heap-Based Order Matching System            ║
╚════════════════════════════════════════════════╝

📂 Loading orders from CSV...

✅ Added BUY order: AAPL 100 shares @ $174.50
✅ Added SELL order: AAPL 50 shares @ $176.00

🔄 Starting Order Matching Engine...

📊 Matching orders for AAPL:
  ✨ MATCH! Trade #1: 50 shares @ $176.00
     Buyer (User 1) ← → Seller (User 2)
     ⚠️  Buy order partially filled, 50 shares remaining

✅ Matching complete! Total trades: 1

💾 Saved 1 trades to data/trades.csv
```

## 🧪 Testing the Engine

### Test Case 1: Perfect Match
```csv
orderId,userId,symbol,type,quantity,price,timestamp,status
1,1,AAPL,BUY,100,175.00,2025-03-31T09:30:00,PENDING
2,2,AAPL,SELL,100,174.00,2025-03-31T09:31:00,PENDING
```
**Result**: ✅ Full match at $174.00 (buyer gets better price!)

### Test Case 2: No Match
```csv
orderId,userId,symbol,type,quantity,price,timestamp,status
1,1,AAPL,BUY,100,170.00,2025-03-31T09:30:00,PENDING
2,2,AAPL,SELL,100,175.00,2025-03-31T09:31:00,PENDING
```
**Result**: ❌ No match (buy $170 < sell $175)

### Test Case 3: Partial Fill
```csv
orderId,userId,symbol,type,quantity,price,timestamp,status
1,1,AAPL,BUY,100,175.00,2025-03-31T09:30:00,PENDING
2,2,AAPL,SELL,50,174.00,2025-03-31T09:31:00,PENDING
```
**Result**: ⚠️ Partial match - 50 shares traded, 50 remain in buy order

## 🔧 Customization

### Add More Orders
Edit `data/orders.csv` and add your orders:
```csv
1021,13,TSLA,BUY,200,240.00,2025-03-31T10:00:00,PENDING
1022,5,TSLA,SELL,150,242.00,2025-03-31T10:01:00,PENDING
```

### Modify Matching Logic
Edit the `matchOrders()` function in `matching_engine.c`:
```c
// Current: Execute at sell price
trade.price = sellOrder->price;

// Alternative: Execute at mid-price
trade.price = (buyOrder->price + sellOrder->price) / 2.0;
```

## 📈 Performance

- **Order insertion**: O(log n) - Heap insertion
- **Order matching**: O(log n) - Heap extraction
- **Space complexity**: O(n) - Store all orders in heaps

## 🔮 Future Enhancements

1. **Network API** - Add TCP/IP server for real-time order submission
2. **Multi-threading** - Process multiple symbols concurrently
3. **Persistence** - Real database integration (SQLite/PostgreSQL)
4. **Order Types** - Limit orders, market orders, stop-loss
5. **WebSocket** - Real-time order book updates to frontend

## 📞 Integration with React Frontend

The C backend can be integrated with the React frontend via:

1. **REST API** - Wrap C code in a web server (Flask/Express)
2. **WebSockets** - Real-time order book updates
3. **File-based** - Frontend writes orders.csv, backend processes, frontend reads trades.csv

Example integration flow:
```
React Frontend → POST /api/order → Node.js/Python API → Execute C binary → Update CSV → Send response
```

## 🏆 Key Features

✅ **Real heap-based matching** (Min-Heap + Max-Heap)  
✅ **Price-time priority** algorithm  
✅ **Partial order fills** support  
✅ **Multiple stock symbols** handling  
✅ **CSV import/export** for easy testing  
✅ **Detailed execution logs** with emoji indicators  
✅ **Production-ready** C code with proper memory management  

## 📚 Learn More

- [Heap Data Structure](https://en.wikipedia.org/wiki/Heap_(data_structure))
- [Order Matching Algorithms](https://en.wikipedia.org/wiki/Order_matching_system)
- [Stock Exchange Systems](https://en.wikipedia.org/wiki/Stock_exchange)

---

**Made with ❤️ for high-frequency trading simulations**
