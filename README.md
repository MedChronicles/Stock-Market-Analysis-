#  Stock Trading & Order Book Simulator

A pure **C-based command-line trading simulator** that recreates the basic working of a real stock exchange order book. It uses **Min-Heap and Max-Heap priority queues** to manage buy and sell orders and processes market data from a CSV file.

The main idea is simple: users can register, log in, buy and sell stocks, and watch their orders get matched against the available market orders. The project focuses on showing how data structures such as heaps can be used to build a practical trading system from scratch.

> Every order match, price change, and VWAP calculation is handled through the data structures implemented in C, without using a database or external libraries.

---

##  Table of Contents

* [Overview](#-overview)
* [Features](#-features)
* [How Order Matching Works](#-how-order-matching-works)
* [Tech Stack](#️-tech-stack)
* [Project Structure](#-project-structure)
* [Getting Started](#-getting-started)
* [Usage Walkthrough](#-usage-walkthrough)
* [Order Book CSV Format](#-order-book-csv-format)
* [Complexity](#-complexity)
* [Roadmap](#-roadmap)
* [License](#-license)

---

## Overview

`stock_trading.c` reads an `order_book.csv` file containing market orders for around 100 real-world stock symbols. Users can create an account, log in, and trade stocks directly through the terminal.

Each stock has two separate heaps:

* A **Min-Heap** for SELL orders, where the lowest selling price gets priority.
* A **Max-Heap** for BUY orders, where the highest buying price gets priority.

When someone buys a stock, the program starts with the cheapest available sell order. When someone sells, it starts with the highest available buy order. This allows the simulator to follow the basic logic used by a real limit order book.

---

##  Features

| Feature                  | Description                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **User Authentication**  | Users can register and log in. Account information is stored in `users.dat`. An admin account is created automatically on the first run. |
| **Order Book Engine**    | Uses a Min-Heap for sell orders and a Max-Heap for buy orders for each stock.                                                            |
| **Market Buy / Sell**    | Matches buy and sell requests against available orders until the requested quantity is filled or the order book runs out.                |
| **Iceberg Orders**       | Allows large orders to be divided into smaller visible portions instead of showing the entire quantity at once.                          |
| **Pending Limit Orders** | Users can place orders that wait until the stock reaches their chosen price.                                                             |
| **Live Price Movement**  | The current price changes slightly when available price levels are exhausted.                                                            |
| **VWAP Calculation**     | Calculates the Volume-Weighted Average Price using matched trades from the CSV data.                                                     |
| **Portfolio Management** | Keeps track of the stocks owned by each user, quantities, and average buying prices.                                                     |
| **Trade History & P&L**  | Stores previous trades and calculates realized profit or loss.                                                                           |
| **Admin Panel**          | Admins can manage users, change balances and passwords, inspect order books, and view VWAP information.                                  |
| **Real Stock Symbols**   | Includes around 100 real symbols such as AAPL, TSLA, NVDA, MSFT, and others.                                                             |

---

##  How Order Matching Works

1. When the program starts, `order_book.csv` is loaded and each order is placed into the appropriate heap for its stock.
2. VWAP and a reference price are calculated for each stock using matched orders.
3. When a user buys, the program checks the **sell Min-Heap** and starts with the lowest available selling price.
4. If the user still needs more shares, the program continues to the next available price level.
5. When a user sells, the program does the opposite by checking the **buy Max-Heap**, starting with the highest available buying price.
6. Iceberg orders divide a large order into smaller visible portions and process them one wave at a time.
7. Pending orders remain in the system until the market price reaches the user's specified limit.

This makes the project a practical example of how **heaps and priority queues can be applied to stock-market order matching**.

---

##  Tech Stack

* **C (C99)** — Main programming language
* Standard C libraries:

  * `stdio.h`
  * `stdlib.h`
  * `string.h`
  * `math.h`
  * `ctype.h`
* **Flat-file storage**

  * `users.dat` for user accounts
  * `order_book.csv` for market data

The project does not use a database or external libraries.

---

##  Project Structure

```text
Stock-Market-Analysis-/
├── stock_trading.c     # Main program containing the complete trading engine
├── order_book.csv      # Market data containing around 4,000 orders
├── LICENSE
└── README.md
```

---

##  Getting Started

### Prerequisites

You only need a C compiler such as GCC, Clang, or MSVC.

### Build

```bash
gcc -o stock_trading stock_trading.c -lm
```

### Run

```bash
./stock_trading
```

Make sure `order_book.csv` is present in the same directory as the executable. The program needs this file to load the initial market data.

### Default Admin Login

On the first run, an admin account is automatically created:

```text
username: admin
password: admin@123
```

Regular users can create their own accounts through the registration option.

---

##  Usage Walkthrough

### Main Menu

Users can:

1. Register
2. Login
3. Exit

### Trader Dashboard

After logging in, a regular user can:

1. **Browse Companies & Trade** — Choose a stock from the available list.
2. **Buy / Sell** — Enter a stock symbol and quantity and trade against the current order book.
3. **Place Iceberg Order** — Split a large order into smaller visible portions.
4. **My Portfolio** — Check current holdings and average purchase price.
5. **Trade History** — View previous trades and realized P&L.
6. **Pending Orders** — View or cancel pending limit orders.
7. **Iceberg Orders** — View or cancel active iceberg orders.
8. **View Order Book** — Inspect the current buy and sell orders for a stock.

### Admin Panel

The admin can manage users, reset passwords, change balances, delete accounts, and inspect order-book and VWAP information for different stocks.

---

##  Order Book CSV Format

The `order_book.csv` file contains the market data used by the simulator.

| Column           | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `Order_ID`       | Unique ID assigned to an order                          |
| `Stock_Symbol`   | Stock ticker such as AAPL or TSLA                       |
| `Queue_Position` | Used to decide priority when orders have the same price |
| `Order_Type`     | BUY or SELL                                             |
| `Quantity`       | Number of shares in the order                           |
| `Price($)`       | Limit price of the order                                |
| `Check_Block`    | Reference to the opposing side                          |
| `Timestamp`      | Time associated with the order                          |

Rows marked as `MATCHED` with a valid execution price are also used when calculating VWAP for each stock.

Users can replace the existing market data with their own CSV file as long as the same structure is maintained.

---

##  Complexity

| Operation                        | Time Complexity                        |
| -------------------------------- | -------------------------------------- |
| Push order onto heap             | O(log n)                               |
| Remove best order from heap      | O(log n)                               |
| Find/create a stock's order book | O(s), where s is the number of symbols |
| Load all orders from CSV         | O(n log n)                             |

The heap-based design allows the program to quickly find the best available buy or sell order without scanning the entire order book every time.

---

## Roadmap

Some possible improvements for the future include:

* [ ] Save the updated order book after each session
* [ ] Add multi-threading for concurrent order matching
* [ ] Add stop-loss and take-profit orders
* [ ] Export trade history to CSV
* [ ] Allow file paths to be passed through command-line arguments

---

##  License

Licensed under the MIT License.

---

**A from-scratch implementation of a stock-market order book that demonstrates how heaps and priority queues can be used to build a simple trading engine in C.**
