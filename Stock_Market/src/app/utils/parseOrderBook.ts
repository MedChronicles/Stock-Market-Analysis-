import orderBookCSV from '../../imports/order_book.csv?raw';

export interface OrderBookEntry {
  orderId: string;
  symbol: string;
  queuePosition: number;
  orderType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  checkBlock: 'BUY' | 'SELL';
  timestamp: Date;
}

export interface StockData {
  symbol: string;
  name: string;
  bestBid: number;
  bestAsk: number;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
}

const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  TSLA: 'Tesla Inc.',
  META: 'Meta Platforms Inc.',
  NVDA: 'NVIDIA Corporation',
  NFLX: 'Netflix Inc.',
  AMD: 'Advanced Micro Devices',
  INTC: 'Intel Corporation',
  BABA: 'Alibaba Group Holding',
  PYPL: 'PayPal Holdings',
  CRM: 'Salesforce Inc.',
  ADBE: 'Adobe Inc.',
  CSCO: 'Cisco Systems',
  ORCL: 'Oracle Corporation',
  QCOM: 'Qualcomm Inc.',
  IBM: 'International Business Machines',
  UBER: 'Uber Technologies',
  LYFT: 'Lyft Inc.',
  SNAP: 'Snap Inc.',
  TWTR: 'Twitter Inc.',
  SQ: 'Block Inc.',
  SHOP: 'Shopify Inc.',
  SPOT: 'Spotify Technology',
  ROKU: 'Roku Inc.',
  ZM: 'Zoom Video Communications',
  DOCU: 'DocuSign Inc.',
  COIN: 'Coinbase Global',
  HOOD: 'Robinhood Markets',
  PLTR: 'Palantir Technologies',
  RBLX: 'Roblox Corporation',
  RIVN: 'Rivian Automotive',
  LCID: 'Lucid Group',
  NIO: 'NIO Inc.',
  XPEV: 'XPeng Inc.',
  LI: 'Li Auto Inc.',
  DKNG: 'DraftKings Inc.',
  PENN: 'PENN Entertainment',
  CHGG: 'Chegg Inc.',
  BYND: 'Beyond Meat',
  PTON: 'Peloton Interactive',
  LMND: 'Lemonade Inc.',
  ROOT: 'Root Inc.',
  OPEN: 'Opendoor Technologies',
  RDFN: 'Redfin Corporation',
  CVNA: 'Carvana Co.',
  UPST: 'Upstart Holdings',
  AFRM: 'Affirm Holdings',
  SOFI: 'SoFi Technologies',
  SPCE: 'Virgin Galactic',
  FVRR: 'Fiverr International',
  ETSY: 'Etsy Inc.',
  DUOL: 'Duolingo Inc.',
  ABNB: 'Airbnb Inc.',
  DASH: 'DoorDash Inc.',
  MELI: 'MercadoLibre Inc.',
  SEA: 'Sea Limited',
  GRAB: 'Grab Holdings',
  DIDI: 'DiDi Global',
  NU: 'Nu Holdings',
  PAGS: 'PagSeguro Digital',
  STNE: 'StoneCo Ltd.',
  MARA: 'Marathon Digital',
  RIOT: 'Riot Platforms',
  HUT: 'Hut 8 Mining',
  BITF: 'Bitfarms Ltd.',
  AG: 'First Majestic Silver',
  AEM: 'Agnico Eagle Mines',
  GOLD: 'Barrick Gold',
  KGC: 'Kinross Gold',
  MAG: 'MAG Silver',
  CDE: 'Coeur Mining',
  HL: 'Hecla Mining',
  EXK: 'Endeavour Silver',
  FSM: 'Fortuna Silver Mines',
  GPL: 'Great Panther Mining',
  BEEF: 'Minerva Foods',
  BIOX: 'Bioceres Crop Solutions',
  BRKM: 'Braskem S.A.',
  BBD: 'Banco Bradesco',
  SUZB: 'Suzano S.A.',
  MGLU: 'Magazine Luiza',
  ITUB: 'Itaú Unibanco',
  PBR: 'Petróleo Brasileiro',
  VALE: 'Vale S.A.',
  AGRO: 'Adecoagro S.A.',
  CAAP: 'Corporación América Airports',
  DESP: 'Despegar.com',
  LOMA: 'Loma Negra',
  VIST: 'Vista Energy',
  ARCO: 'Arcos Dorados',
  CEPU: 'Central Puerto',
  GLOB: 'Globant S.A.',
  IRSA: 'IRSA Inversiones',
  COMP: 'Compass Inc.',
  EXPI: 'eXp World Holdings',
  HOUS: 'Anywhere Real Estate',
  RENT: 'Localiza Rent a Car',
  WMT: 'Walmart Inc.',
  DAL: 'Delta Airlines',
  NKE: 'Nike Inc.',
  MCD: "McDonald's Corporation",
  ERIC: 'Ericsson',
  DLX: 'Deluxe Corporation',
  RUT: 'Russell 2000 Index',
  SPX: 'S&P 500 Index',
  VIX: 'Volatility Index',
  AAL: 'American Airlines',
  DIS: 'Walt Disney Company',
  FE: 'FirstEnergy Corp',
  LHX: 'L3Harris Technologies',
};

function seededChange(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  return parseFloat(((hash % 1000) / 100 - 5).toFixed(2)); // stable -5% to +5%
}

export function parseOrderBook(): OrderBookEntry[] {
  const lines = orderBookCSV.trim().split('\n');
  const entries: OrderBookEntry[] = [];

  // Skip header row if present
  const startIndex = lines[0]?.toLowerCase().includes('orderid') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Structure: orderId, symbol, queuePosition, orderType, quantity, price, checkBlock, timestamp
    const parts = line.split(',');
    if (parts.length < 8) continue;

    const queuePosition = parseInt(parts[2].trim());
    const quantity      = parseInt(parts[4].trim());
    const price         = parseFloat(parts[5].trim());

    if (isNaN(queuePosition) || isNaN(quantity) || isNaN(price)) continue;

    const orderType  = parts[3].trim().toUpperCase();
    const checkBlock = parts[6].trim().toUpperCase();

    if (orderType !== 'BUY' && orderType !== 'SELL') continue;
    if (checkBlock !== 'BUY' && checkBlock !== 'SELL') continue;

    // Timestamp may contain a space — safe to rejoin from col 7 onward
    const timestamp = new Date(parts.slice(7).join(',').trim());
    if (isNaN(timestamp.getTime())) continue;

    entries.push({
      orderId:       parts[0].trim(),
      symbol:        parts[1].trim().toUpperCase(),
      queuePosition,
      orderType:     orderType as 'BUY' | 'SELL',
      quantity,
      price,
      checkBlock:    checkBlock as 'BUY' | 'SELL',
      timestamp,
    });
  }

  return entries;
}

export function generateStocksFromOrderBook(): StockData[] {
  const entries = parseOrderBook();

  const symbolMap = new Map<string, { buyPrices: number[]; sellPrices: number[]; totalQty: number }>();

  entries.forEach(entry => {
    if (!symbolMap.has(entry.symbol)) {
      symbolMap.set(entry.symbol, { buyPrices: [], sellPrices: [], totalQty: 0 });
    }
    const data = symbolMap.get(entry.symbol)!;

    // BUY orders = bids, SELL orders = asks
    if (entry.orderType === 'BUY') {
      data.buyPrices.push(entry.price);
    } else {
      data.sellPrices.push(entry.price);
    }
    data.totalQty += entry.quantity;
  });

  const stocks: StockData[] = [];

  symbolMap.forEach((data, symbol) => {
    // bestBid = highest price a buyer will pay
    const bestBid = data.buyPrices.length > 0
      ? parseFloat(Math.max(...data.buyPrices).toFixed(2))
      : 0;

    // bestAsk = lowest price a seller will accept
    const bestAsk = data.sellPrices.length > 0
      ? parseFloat(Math.min(...data.sellPrices).toFixed(2))
      : 0;

    const lastPrice = bestAsk > 0 ? bestAsk : bestBid;
    const changePercent = seededChange(symbol);
    const change = parseFloat((lastPrice * (changePercent / 100)).toFixed(2));

    stocks.push({
      symbol,
      name:          STOCK_NAMES[symbol] || `${symbol} Corp.`,
      bestBid,
      bestAsk,
      lastPrice,
      change,
      changePercent,
      volume:        data.totalQty,
    });
  });

  return stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
}