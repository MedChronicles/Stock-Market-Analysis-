# Stock Market Order Book Simulator

A command-line stock trading simulator written in pure C. It models a simplified limit order book using a **min-heap for sell orders** and a **max-heap for buy orders**, so every trade is matched the way a real exchange would: cheapest seller first when you buy, highest bidder first when you sell.

Market data is loaded from a CSV file at startup, users can register/log in, and trades are matched live against the in-memory order book — no database, no external dependencies, just standard C libraries.

## Contents

- [What it does](#what-it-does)
- [Features](#features)
- [How matching works](#how-matching-works)
- [Getting started](#getting-started)
- [Using the simulator](#using-the-simulator)
- [Market data format](#market-data-format)
- [Project layout](#project-layout)
- [Performance notes](#performance-notes)
- [Ideas for extending it](#ideas-for-extending-it)
- [License](#license)

## What it does

On launch, the program reads `order_book.csv` and builds a separate order book for each stock symbol it finds — around 100 real-world tickers (AAPL, TSLA, NVDA, MSFT, and so on) are included by default. Each book keeps:

- a **min-heap** of outstanding sell orders (lowest price on top)
- a **max-heap** of outstanding buy orders (highest price on top)
- a running VWAP and a "live" price that shifts as liquidity gets consumed

From there, a user can register an account, log in, and start buying or selling — the engine walks the relevant heap to fill the order, pulling from the best-priced level first and moving to the next level if there isn't enough quantity available.

## Features

- **Accounts** — register/login flow with credentials persisted to a flat binary file (`users.dat`); an admin account is seeded automatically on first run.
- **Market buy/sell** — orders fill against the live order book, walking price levels until the requested quantity is met or the book runs dry.
- **Iceberg orders** — split a large position into smaller "visible" slices that fill in waves, rather than exposing the full size at once.
- **Pending limit orders** — place an order that sits inactive until the market reaches your chosen price.
- **Live price movement** — the market price nudges up or down as price levels get exhausted, simulating price impact.
- **VWAP** — volume-weighted average price is computed per symbol from historical matched trades in the CSV.
- **Portfolio tracking** — quantity and running average cost basis per holding, plus total account value (cash + positions).
- **Trade history & realized P&L** — every fill is logged with symbol, price, quantity, and profit/loss.
- **Admin tools** — inspect and adjust user balances, reset passwords, and view order-book/VWAP state per symbol.

## How matching works

1. `order_book.csv` is parsed once at startup; each row is pushed onto the correct heap for its symbol.
2. A reference price and VWAP are derived per symbol from the loaded data.
3. **Buying** pops from the sell min-heap — you get the cheapest available offer first, then the next-cheapest, and so on until your order is filled.
4. **Selling** pops from the buy max-heap — same idea, but from the highest bid down.
5. **Iceberg orders** repeat this matching logic slice-by-slice across multiple "waves," so only part of the order is visible to the book at any moment.
6. **Pending orders** are held aside and only get matched once the live price crosses the user's limit.

Because a heap gives O(log n) insertion and O(log n) removal-of-best, the engine never has to scan the whole book to find the next order to fill.

## Getting started

You just need a C compiler — GCC, Clang, or MSVC all work.

```bash
git clone https://github.com/MedChronicles/Stock-Market-Analysis-.git
cd Stock-Market-Analysis-

# build
gcc -o stock_trading stock_trading.c -lm

# run (order_book.csv must be in the same folder)
./stock_trading
```

On the very first run, the program creates a default admin account:

```
username: admin
password: admin@123
```

Everyone else registers their own account from the main menu and starts with a simulated cash balance to trade with.

## Using the simulator

**Main menu:** register, log in, or exit.

**Once logged in, a trader can:**

| Option | What it does |
|---|---|
| Browse & trade | Pick a symbol from the loaded market and place a buy or sell |
| Iceberg order | Trade a large position in smaller visible waves |
| Pending orders | View or cancel resting limit orders |
| Iceberg orders | View or cancel active iceberg positions |
| Portfolio | See current holdings, average cost, and unrealized P&L |
| Trade history | Review past fills and realized P&L |
| Order book | Inspect live bid/ask depth for a symbol |

**The admin account** additionally gets a management view: adjust or reset user balances/passwords, remove accounts, and inspect order-book/VWAP state across symbols.

## Market data format

`order_book.csv` supplies the orders each book is seeded with. It follows this shape:

| Column | Meaning |
|---|---|
| Order ID | Unique identifier for the order |
| Symbol | Ticker, e.g. `AAPL` |
| Queue position | Tie-breaker for orders at the same price |
| Order type | `BUY` or `SELL` |
| Quantity | Shares in the order |
| Price | Limit price for the order |
| Status / execution fields | Used to flag matched trades and their fill price |
| Timestamp | When the order was placed |

Rows flagged as already matched (with a valid execution price) feed into the VWAP calculation for that symbol. You can swap in your own CSV as long as the column layout is preserved.

## Project layout

```
Stock-Market-Analysis-/
├── stock_trading.c   # entire trading engine — heaps, matching, accounts, UI
├── order_book.csv    # seed market data (~100 symbols, thousands of orders)
├── LICENSE
└── README.md
```

## Performance notes

| Operation | Cost |
|---|---|
| Insert an order | O(log n) |
| Pop the best-priced order | O(log n) |
| Look up a symbol's book | O(s) — s = number of symbols |
| Load the full CSV | O(n log n) |

Using heaps instead of, say, a sorted array or linear scan is what keeps order matching fast even as the book grows — the engine only ever needs the current best price, not a full sort.

## Ideas for extending it

- Persist the order book state back to disk between sessions
- Stop-loss / take-profit order types
- Export trade history to its own CSV
- Accept the market-data file path as a command-line argument
- Concurrent order matching (would need real synchronization around the heaps)

## License

MIT — see [`LICENSE`](./LICENSE) for details.
