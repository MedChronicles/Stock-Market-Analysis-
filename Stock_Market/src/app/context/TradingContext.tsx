import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Stock {
  symbol: string;
  name: string;
  bestAsk: number;
  bestBid: number;
  changePercent: number;
  volume: number;
}

export interface Order {
  id: string;
  price: number;
  quantity: number;
  userId?: string;
  completed?: boolean; // New field to track if order is completed
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: Date;
  profitLoss?: number;
  status?: 'COMPLETED' | 'PENDING'; // Add status field
}

export interface PortfolioItem {
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
}

export interface PendingOrder {
  id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
}

export interface User {
  username: string;
  balance: number;
  isAdmin: boolean;
  portfolio: PortfolioItem[];
  trades: Trade[];
  pendingOrders: PendingOrder[]; // Add pending orders
}

interface TradingContextType {
  currentUser: User | null;
  users: User[];
  stocks: Stock[];
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => boolean;
  logout: () => void;
  buyStock: (symbol: string, quantity: number, customPrice?: number) => boolean;
  sellStock: (symbol: string, quantity: number, customPrice?: number) => boolean;
  getOrderBook: (symbol: string) => { sellOrders: Order[], buyOrders: Order[] };
  updateUserBalance: (username: string, newBalance: number) => void;
  deleteUser: (username: string) => void;
  addFunds: (amount: number) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

// Mock data
const INITIAL_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', bestAsk: 178.25, bestBid: 177.80, changePercent: 0.5, volume: 52340000 },
  { symbol: 'TSLA', name: 'Tesla Inc.', bestAsk: 242.50, bestBid: 241.90, changePercent: 1.2, volume: 48750000 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', bestAsk: 875.60, bestBid: 874.20, changePercent: 2.8, volume: 38920000 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', bestAsk: 168.40, bestBid: 167.95, changePercent: -0.3, volume: 42180000 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', bestAsk: 139.75, bestBid: 139.20, changePercent: 0.4, volume: 28650000 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', bestAsk: 415.30, bestBid: 414.85, changePercent: 0.6, volume: 31420000 },
  { symbol: 'META', name: 'Meta Platforms Inc.', bestAsk: 485.90, bestBid: 485.20, changePercent: 1.7, volume: 25890000 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', bestAsk: 162.45, bestBid: 161.90, changePercent: -0.9, volume: 33270000 },
  // 30 New Companies
  { symbol: 'NFLX', name: 'Netflix Inc.', bestAsk: 485.60, bestBid: 484.90, changePercent: 1.0, volume: 18540000 },
  { symbol: 'INTC', name: 'Intel Corporation', bestAsk: 42.85, bestBid: 42.60, changePercent: -1.1, volume: 29760000 },
  { symbol: 'ADBE', name: 'Adobe Inc.', bestAsk: 582.40, bestBid: 581.75, changePercent: 0.8, volume: 12340000 },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', bestAsk: 51.30, bestBid: 51.10, changePercent: 0.3, volume: 19850000 },
  { symbol: 'ORCL', name: 'Oracle Corporation', bestAsk: 108.95, bestBid: 108.50, changePercent: -0.4, volume: 14920000 },
  { symbol: 'CRM', name: 'Salesforce Inc.', bestAsk: 272.80, bestBid: 272.20, changePercent: 1.5, volume: 11680000 },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', bestAsk: 64.75, bestBid: 64.40, changePercent: -1.6, volume: 22340000 },
  { symbol: 'BABA', name: 'Alibaba Group', bestAsk: 88.60, bestBid: 88.20, changePercent: 2.7, volume: 35670000 },
  { symbol: 'DIS', name: 'The Walt Disney Company', bestAsk: 93.45, bestBid: 93.10, changePercent: -0.8, volume: 17890000 },
  { symbol: 'BA', name: 'Boeing Company', bestAsk: 177.20, bestBid: 176.80, changePercent: 1.9, volume: 8920000 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', bestAsk: 189.50, bestBid: 189.10, changePercent: 0.5, volume: 13240000 },
  { symbol: 'V', name: 'Visa Inc.', bestAsk: 272.35, bestBid: 271.90, changePercent: 0.7, volume: 9580000 },
  { symbol: 'MA', name: 'Mastercard Inc.', bestAsk: 445.60, bestBid: 445.10, changePercent: 0.9, volume: 7650000 },
  { symbol: 'WMT', name: 'Walmart Inc.', bestAsk: 68.90, bestBid: 68.60, changePercent: -0.2, volume: 16340000 },
  { symbol: 'HD', name: 'The Home Depot Inc.', bestAsk: 365.20, bestBid: 364.75, changePercent: 0.4, volume: 6780000 },
  { symbol: 'COST', name: 'Costco Wholesale', bestAsk: 732.40, bestBid: 731.80, changePercent: 1.2, volume: 5890000 },
  { symbol: 'NKE', name: 'Nike Inc.', bestAsk: 78.65, bestBid: 78.30, changePercent: -1.3, volume: 14520000 },
  { symbol: 'SBUX', name: 'Starbucks Corporation', bestAsk: 95.80, bestBid: 95.45, changePercent: 0.6, volume: 11230000 },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', bestAsk: 293.50, bestBid: 293.00, changePercent: 0.3, volume: 4670000 },
  { symbol: 'PFE', name: 'Pfizer Inc.', bestAsk: 28.45, bestBid: 28.20, changePercent: -0.7, volume: 32450000 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', bestAsk: 156.30, bestBid: 155.95, changePercent: 0.2, volume: 8910000 },
  { symbol: 'UNH', name: 'UnitedHealth Group', bestAsk: 512.80, bestBid: 512.20, changePercent: 0.8, volume: 5340000 },
  { symbol: 'CVX', name: 'Chevron Corporation', bestAsk: 154.75, bestBid: 154.30, changePercent: -0.5, volume: 12670000 },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', bestAsk: 111.40, bestBid: 111.05, changePercent: -0.4, volume: 18920000 },
  { symbol: 'KO', name: 'The Coca-Cola Company', bestAsk: 61.85, bestBid: 61.55, changePercent: 0.1, volume: 15780000 },
  { symbol: 'PEP', name: 'PepsiCo Inc.', bestAsk: 168.90, bestBid: 168.50, changePercent: 0.3, volume: 7890000 },
  { symbol: 'T', name: 'AT&T Inc.', bestAsk: 21.65, bestBid: 21.45, changePercent: -0.6, volume: 42350000 },
  { symbol: 'VZ', name: 'Verizon Communications', bestAsk: 40.20, bestBid: 39.95, changePercent: -0.3, volume: 28640000 },
  { symbol: 'CMCSA', name: 'Comcast Corporation', bestAsk: 39.80, bestBid: 39.55, changePercent: -0.4, volume: 21890000 },
];

// Seeded random function for consistent data per symbol
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateOrderBook = (symbol: string): { sellOrders: Order[], buyOrders: Order[] } => {
  const stock = INITIAL_STOCKS.find(s => s.symbol === symbol);
  if (!stock) return { sellOrders: [], buyOrders: [] };

  // Create seed from symbol for consistent data
  const symbolSeed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const sellOrders: Order[] = [];
  const buyOrders: Order[] = [];

  // Generate SELL orders (Min-Heap - ASCENDING prices, lowest at Priority #1)
  let sellPrice = stock.bestAsk;
  for (let i = 0; i < 15; i++) {
    const seed = symbolSeed + i * 7;
    const randomVal = seededRandom(seed);

    // Varied increments with seed-based randomness
    const increment = i < 5
      ? 0.18 + (randomVal * 0.17) // Tight: 0.18-0.35
      : i < 10
      ? 0.28 + (randomVal * 0.27) // Medium: 0.28-0.55
      : 0.38 + (randomVal * 0.37); // Wide: 0.38-0.75

    sellPrice += increment;

    const qtySeed = symbolSeed + i * 13;
    const quantity = 100 + Math.floor(seededRandom(qtySeed) * 400); // 100-500 shares

    sellOrders.push({
      id: `SELL-${symbol}-${i}`,
      price: Math.round(sellPrice * 100) / 100, // Round to 2 decimals
      quantity: quantity,
    });
  }

  // Generate BUY orders (Max-Heap - DESCENDING prices, highest at Priority #1)
  let buyPrice = stock.bestBid;
  for (let i = 0; i < 15; i++) {
    const seed = symbolSeed + i * 11;
    const randomVal = seededRandom(seed);

    // Varied decrements with seed-based randomness
    const decrement = i < 5
      ? 0.15 + (randomVal * 0.15) // Tight: 0.15-0.30
      : i < 10
      ? 0.25 + (randomVal * 0.25) // Medium: 0.25-0.50
      : 0.35 + (randomVal * 0.35); // Wide: 0.35-0.70

    buyPrice -= decrement;

    const qtySeed = symbolSeed + i * 17;
    const quantity = 80 + Math.floor(seededRandom(qtySeed) * 420); // 80-500 shares

    buyOrders.push({
      id: `BUY-${symbol}-${i}`,
      price: Math.round(buyPrice * 100) / 100, // Round to 2 decimals
      quantity: quantity,
    });
  }

  return { sellOrders, buyOrders };
};

const ADMIN_USER: User = {
  username: 'admin',
  balance: 1000000,
  isAdmin: true,
  portfolio: [],
  trades: [],
  pendingOrders: [],
};

export function TradingProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([
    ADMIN_USER,
    {
      username: 'john_trader',
      balance: 250000,
      isAdmin: false,
      portfolio: [
        { symbol: 'AAPL', name: 'Apple Inc.', quantity: 50, avgBuyPrice: 175.50, currentPrice: 177.80 },
        { symbol: 'TSLA', name: 'Tesla Inc.', quantity: 25, avgBuyPrice: 240.00, currentPrice: 241.90 },
      ],
      trades: [
        { id: 'T001', symbol: 'AAPL', type: 'BUY', price: 175.50, quantity: 50, timestamp: new Date('2026-03-20'), profitLoss: 0 },
        { id: 'T002', symbol: 'TSLA', type: 'BUY', price: 240.00, quantity: 25, timestamp: new Date('2026-03-22'), profitLoss: 0 },
      ],
      pendingOrders: [
        { id: 'P001', symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'BUY', price: 139.50, quantity: 10 },
        { id: 'P002', symbol: 'MSFT', name: 'Microsoft Corporation', type: 'BUY', price: 414.00, quantity: 5 },
      ],
    },
    {
      username: 'sarah_investor',
      balance: 750000,
      isAdmin: false,
      portfolio: [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', quantity: 10, avgBuyPrice: 850.00, currentPrice: 874.20 },
      ],
      trades: [
        { id: 'T003', symbol: 'NVDA', type: 'BUY', price: 850.00, quantity: 10, timestamp: new Date('2026-03-25'), profitLoss: 0 },
      ],
      pendingOrders: [],
    },
  ]);

  // Track consumed order quantities per symbol
  const [consumedOrders, setConsumedOrders] = useState<Record<string, Record<string, number>>>({});
  
  // Dynamic stock prices based on order book
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);

  const login = (username: string, password: string): boolean => {
    if (username === 'admin' && password === 'admin@123') {
      setCurrentUser(ADMIN_USER);
      return true;
    }
    
    const user = users.find(u => u.username === username);
    if (user && !user.isAdmin) {
      setCurrentUser(user);
      return true;
    }
    
    return false;
  };

  const register = (username: string, password: string): boolean => {
    if (users.some(u => u.username === username)) {
      return false;
    }

    const newUser: User = {
      username,
      balance: 500000,
      isAdmin: false,
      portfolio: [],
      trades: [],
      pendingOrders: [],
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    // Navigation will be handled by the Dashboard component
  };

  const buyStock = (symbol: string, quantity: number, customPrice?: number): boolean => {
    if (!currentUser) return false;

    const stock = INITIAL_STOCKS.find(s => s.symbol === symbol);
    if (!stock) return false;

    // For market orders (no custom price), match against sell orders in the order book
    if (!customPrice) {
      const orderBook = getOrderBook(symbol);
      const sellOrders = orderBook.sellOrders;

      let remainingQty = quantity;
      let totalCost = 0;
      const filledOrders: Array<{ price: number; quantity: number; orderId: string }> = [];

      // Match against sell orders (lowest price first - Min-Heap behavior)
      for (const order of sellOrders) {
        if (remainingQty <= 0) break;

        const fillQty = Math.min(remainingQty, order.quantity);
        const fillCost = fillQty * order.price;

        totalCost += fillCost;
        remainingQty -= fillQty;

        filledOrders.push({
          price: order.price,
          quantity: fillQty,
          orderId: order.id,
        });
      }

      // Check if we have enough balance for the actual cost
      if (totalCost > currentUser.balance) return false;

      // If we couldn't fill the entire order, still execute what we can
      const executedQty = quantity - remainingQty;
      if (executedQty <= 0) return false;

      // Calculate weighted average price
      const avgExecutionPrice = totalCost / executedQty;
      const newBalance = currentUser.balance - totalCost;

      // Update consumed orders tracking
      setConsumedOrders(prev => {
        const symbolOrders = prev[symbol] || {};
        const updated = { ...symbolOrders };

        filledOrders.forEach(fill => {
          updated[fill.orderId] = (updated[fill.orderId] || 0) + fill.quantity;
        });

        return { ...prev, [symbol]: updated };
      });

      // Update stock prices based on new order book state
      setStocks(prevStocks => {
        const newOrderBook = getOrderBookWithConsumption(symbol, {
          ...consumedOrders,
          [symbol]: {
            ...(consumedOrders[symbol] || {}),
            ...filledOrders.reduce((acc, fill) => {
              acc[fill.orderId] = ((consumedOrders[symbol] || {})[fill.orderId] || 0) + fill.quantity;
              return acc;
            }, {} as Record<string, number>)
          }
        });

        const newBestAsk = newOrderBook.sellOrders[0]?.price || stock.bestAsk;
        const newBestBid = newOrderBook.buyOrders[0]?.price || stock.bestBid;

        return prevStocks.map(s =>
          s.symbol === symbol
            ? { ...s, bestAsk: newBestAsk, bestBid: newBestBid }
            : s
        );
      });

      // Update portfolio
      const existingHolding = currentUser.portfolio.find(p => p.symbol === symbol);
      let newPortfolio;

      if (existingHolding) {
        const totalQty = existingHolding.quantity + executedQty;
        const newAvgPrice = ((existingHolding.avgBuyPrice * existingHolding.quantity) + totalCost) / totalQty;

        newPortfolio = currentUser.portfolio.map(p =>
          p.symbol === symbol
            ? { ...p, quantity: totalQty, avgBuyPrice: newAvgPrice, currentPrice: stock.bestBid }
            : p
        );
      } else {
        newPortfolio = [
          ...currentUser.portfolio,
          {
            symbol,
            name: stock.name,
            quantity: executedQty,
            avgBuyPrice: avgExecutionPrice,
            currentPrice: stock.bestBid,
          }
        ];
      }

      const newTrade: Trade = {
        id: `T${Date.now()}`,
        symbol,
        type: 'BUY',
        price: avgExecutionPrice,
        quantity: executedQty,
        timestamp: new Date(),
        profitLoss: 0,
        status: 'COMPLETED',
      };

      const updatedUser = {
        ...currentUser,
        balance: newBalance,
        portfolio: newPortfolio,
        trades: [...currentUser.trades, newTrade],
      };

      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
      return true;
    }

    // For custom price orders, still execute immediately if price is reasonable
    const pricePerShare = customPrice;
    const cost = pricePerShare * quantity;

    if (cost > currentUser.balance) return false;

    // Check if this is a limit order (below market for buy) - create pending order
    const isPendingOrder = customPrice && customPrice < stock.bestAsk;

    if (isPendingOrder) {
      const newBalance = currentUser.balance - cost;

      const newPendingOrder: PendingOrder = {
        id: `P${Date.now()}`,
        symbol,
        name: stock.name,
        type: 'BUY',
        price: pricePerShare,
        quantity,
      };

      const newTrade: Trade = {
        id: `T${Date.now()}`,
        symbol,
        type: 'BUY',
        price: pricePerShare,
        quantity,
        timestamp: new Date(),
        profitLoss: 0,
        status: 'PENDING',
      };

      const updatedUser = {
        ...currentUser,
        balance: newBalance,
        pendingOrders: [...currentUser.pendingOrders, newPendingOrder],
        trades: [...currentUser.trades, newTrade],
      };

      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
      return true;
    }

    // Execute at custom price if above or equal to market
    const newBalance = currentUser.balance - cost;

    // Update portfolio
    const existingHolding = currentUser.portfolio.find(p => p.symbol === symbol);
    let newPortfolio;

    if (existingHolding) {
      const totalQty = existingHolding.quantity + quantity;
      const newAvgPrice = ((existingHolding.avgBuyPrice * existingHolding.quantity) + cost) / totalQty;

      newPortfolio = currentUser.portfolio.map(p =>
        p.symbol === symbol
          ? { ...p, quantity: totalQty, avgBuyPrice: newAvgPrice, currentPrice: stock.bestBid }
          : p
      );
    } else {
      newPortfolio = [
        ...currentUser.portfolio,
        {
          symbol,
          name: stock.name,
          quantity,
          avgBuyPrice: pricePerShare,
          currentPrice: stock.bestBid,
        }
      ];
    }

    const newTrade: Trade = {
      id: `T${Date.now()}`,
      symbol,
      type: 'BUY',
      price: pricePerShare,
      quantity,
      timestamp: new Date(),
      profitLoss: 0,
      status: 'COMPLETED',
    };

    const updatedUser = {
      ...currentUser,
      balance: newBalance,
      portfolio: newPortfolio,
      trades: [...currentUser.trades, newTrade],
    };

    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
    return true;
  };

  const sellStock = (symbol: string, quantity: number, customPrice?: number): boolean => {
    if (!currentUser) return false;

    const stock = INITIAL_STOCKS.find(s => s.symbol === symbol);
    if (!stock) return false;

    const holding = currentUser.portfolio.find(p => p.symbol === symbol);
    if (!holding || holding.quantity < quantity) return false;

    // For market orders (no custom price), match against buy orders in the order book
    if (!customPrice) {
      const orderBook = getOrderBook(symbol);
      const buyOrders = orderBook.buyOrders;

      let remainingQty = quantity;
      let totalRevenue = 0;
      const filledOrders: Array<{ price: number; quantity: number; orderId: string }> = [];

      // Match against buy orders (highest price first - Max-Heap behavior)
      for (const order of buyOrders) {
        if (remainingQty <= 0) break;

        const fillQty = Math.min(remainingQty, order.quantity);
        const fillRevenue = fillQty * order.price;

        totalRevenue += fillRevenue;
        remainingQty -= fillQty;

        filledOrders.push({
          price: order.price,
          quantity: fillQty,
          orderId: order.id,
        });
      }

      // If we couldn't fill the entire order, still execute what we can
      const executedQty = quantity - remainingQty;
      if (executedQty <= 0) return false;

      // Calculate weighted average price
      const avgExecutionPrice = totalRevenue / executedQty;
      const costBasis = holding.avgBuyPrice * executedQty;
      const profitLoss = totalRevenue - costBasis;
      const newBalance = currentUser.balance + totalRevenue;

      // Update consumed orders tracking
      setConsumedOrders(prev => {
        const symbolOrders = prev[symbol] || {};
        const updated = { ...symbolOrders };

        filledOrders.forEach(fill => {
          updated[fill.orderId] = (updated[fill.orderId] || 0) + fill.quantity;
        });

        return { ...prev, [symbol]: updated };
      });

      // Update stock prices based on new order book state
      setStocks(prevStocks => {
        const newOrderBook = getOrderBookWithConsumption(symbol, {
          ...consumedOrders,
          [symbol]: {
            ...(consumedOrders[symbol] || {}),
            ...filledOrders.reduce((acc, fill) => {
              acc[fill.orderId] = ((consumedOrders[symbol] || {})[fill.orderId] || 0) + fill.quantity;
              return acc;
            }, {} as Record<string, number>)
          }
        });

        const newBestAsk = newOrderBook.sellOrders[0]?.price || stock.bestAsk;
        const newBestBid = newOrderBook.buyOrders[0]?.price || stock.bestBid;

        return prevStocks.map(s =>
          s.symbol === symbol
            ? { ...s, bestAsk: newBestAsk, bestBid: newBestBid }
            : s
        );
      });

      // Update portfolio
      const newPortfolio = holding.quantity === executedQty
        ? currentUser.portfolio.filter(p => p.symbol !== symbol)
        : currentUser.portfolio.map(p =>
            p.symbol === symbol
              ? { ...p, quantity: p.quantity - executedQty }
              : p
          );

      const newTrade: Trade = {
        id: `T${Date.now()}`,
        symbol,
        type: 'SELL',
        price: avgExecutionPrice,
        quantity: executedQty,
        timestamp: new Date(),
        profitLoss,
        status: 'COMPLETED',
      };

      const updatedUser = {
        ...currentUser,
        balance: newBalance,
        portfolio: newPortfolio,
        trades: [...currentUser.trades, newTrade],
      };

      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
      return true;
    }

    // For custom price orders
    const pricePerShare = customPrice;

    // Check if this is a limit order (above market for sell) - create pending order
    const isPendingOrder = customPrice && customPrice > stock.bestBid;

    if (isPendingOrder) {
      const newPendingOrder: PendingOrder = {
        id: `P${Date.now()}`,
        symbol,
        name: stock.name,
        type: 'SELL',
        price: pricePerShare,
        quantity,
      };

      const revenue = pricePerShare * quantity;
      const costBasis = holding.avgBuyPrice * quantity;
      const profitLoss = revenue - costBasis;

      const newTrade: Trade = {
        id: `T${Date.now()}`,
        symbol,
        type: 'SELL',
        price: pricePerShare,
        quantity,
        timestamp: new Date(),
        profitLoss,
        status: 'PENDING',
      };

      const updatedUser = {
        ...currentUser,
        pendingOrders: [...currentUser.pendingOrders, newPendingOrder],
        trades: [...currentUser.trades, newTrade],
      };

      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
      return true;
    }

    // Execute at custom price if below or equal to market
    const revenue = pricePerShare * quantity;
    const costBasis = holding.avgBuyPrice * quantity;
    const profitLoss = revenue - costBasis;

    const newBalance = currentUser.balance + revenue;

    const newPortfolio = holding.quantity === quantity
      ? currentUser.portfolio.filter(p => p.symbol !== symbol)
      : currentUser.portfolio.map(p =>
          p.symbol === symbol
            ? { ...p, quantity: p.quantity - quantity }
            : p
        );

    const newTrade: Trade = {
      id: `T${Date.now()}`,
      symbol,
      type: 'SELL',
      price: pricePerShare,
      quantity,
      timestamp: new Date(),
      profitLoss,
      status: 'COMPLETED',
    };

    const updatedUser = {
      ...currentUser,
      balance: newBalance,
      portfolio: newPortfolio,
      trades: [...currentUser.trades, newTrade],
    };

    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
    return true;
  };

  const getOrderBook = (symbol: string) => {
    return getOrderBookWithConsumption(symbol, consumedOrders);
  };

  // Helper function to get order book with consumption applied
  const getOrderBookWithConsumption = (symbol: string, consumed: Record<string, Record<string, number>>) => {
    const baseOrders = generateOrderBook(symbol);

    // Add pending orders from all users to the order book
    const allPendingOrders = users.flatMap(user =>
      user.pendingOrders
        .filter(order => order.symbol === symbol)
        .map(order => ({
          id: order.id,
          price: order.price,
          quantity: order.quantity,
          userId: user.username,
        }))
    );

    // Separate into buy and sell pending orders
    const pendingBuyOrders = allPendingOrders.filter(order =>
      users.find(u => u.pendingOrders.some(po => po.id === order.id))?.pendingOrders.find(po => po.id === order.id)?.type === 'BUY'
    );
    const pendingSellOrders = allPendingOrders.filter(order =>
      users.find(u => u.pendingOrders.some(po => po.id === order.id))?.pendingOrders.find(po => po.id === order.id)?.type === 'SELL'
    );

    // Apply consumption tracking - mark fully consumed orders as completed
    const symbolConsumed = consumed[symbol] || {};

    const processedSellOrders = baseOrders.sellOrders
      .map(order => {
        const consumedQty = symbolConsumed[order.id] || 0;
        const remainingQty = order.quantity - consumedQty;
        return {
          ...order,
          quantity: remainingQty,
          completed: remainingQty <= 0, // Mark as completed if fully consumed
        };
      });

    const processedBuyOrders = baseOrders.buyOrders
      .map(order => {
        const consumedQty = symbolConsumed[order.id] || 0;
        const remainingQty = order.quantity - consumedQty;
        return {
          ...order,
          quantity: remainingQty,
          completed: remainingQty <= 0, // Mark as completed if fully consumed
        };
      });

    // Separate completed and active orders, then reorganize
    const activeSellOrders = processedSellOrders.filter(o => !o.completed);
    const completedSellOrders = processedSellOrders.filter(o => o.completed);
    
    const activeBuyOrders = processedBuyOrders.filter(o => !o.completed);
    const completedBuyOrders = processedBuyOrders.filter(o => o.completed);

    // Add pending orders to active orders and sort
    const allActiveBuyOrders = [...activeBuyOrders, ...pendingBuyOrders].sort((a, b) => b.price - a.price);
    const allActiveSellOrders = [...activeSellOrders, ...pendingSellOrders].sort((a, b) => a.price - b.price);

    // Combine: active orders first (properly sorted), then completed orders at the end
    const finalBuyOrders = [...allActiveBuyOrders, ...completedBuyOrders];
    const finalSellOrders = [...allActiveSellOrders, ...completedSellOrders];

    return {
      sellOrders: finalSellOrders,
      buyOrders: finalBuyOrders
    };
  };

  const updateUserBalance = (username: string, newBalance: number) => {
    setUsers(users.map(u => 
      u.username === username ? { ...u, balance: newBalance } : u
    ));
    if (currentUser?.username === username) {
      setCurrentUser({ ...currentUser, balance: newBalance });
    }
  };

  const deleteUser = (username: string) => {
    setUsers(users.filter(u => u.username !== username));
    if (currentUser?.username === username) {
      setCurrentUser(null);
    }
  };

  const addFunds = (amount: number) => {
    if (!currentUser) return;

    const newBalance = currentUser.balance + amount;
    const updatedUser = {
      ...currentUser,
      balance: newBalance,
    };

    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
  };

  return (
    <TradingContext.Provider
      value={{
        currentUser,
        users,
        stocks, // Use dynamic stocks state instead of INITIAL_STOCKS
        login,
        register,
        logout,
        buyStock,
        sellStock,
        getOrderBook,
        updateUserBalance,
        deleteUser,
        addFunds,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}