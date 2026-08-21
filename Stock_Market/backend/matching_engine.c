/*
 * Stock Trading Order Matching Engine
 * Implements Min-Heap for SELL orders and Max-Heap for BUY orders
 * Matches buyers with sellers at exact or better prices
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_ORDERS 10000
#define MAX_SYMBOL_LEN 20
#define MAX_TIMESTAMP_LEN 30
#define MAX_LINE_LEN 256

// Order structure
typedef struct {
    int orderId;
    int userId;
    char symbol[MAX_SYMBOL_LEN];
    char type[5]; // BUY or SELL
    int quantity;
    double price;
    char timestamp[MAX_TIMESTAMP_LEN];
    char status[10]; // PENDING, FILLED, PARTIAL
} Order;

// Heap structures for order book
typedef struct {
    Order *orders[MAX_ORDERS];
    int size;
} Heap;

// Global heaps for buy and sell orders (per symbol)
typedef struct {
    char symbol[MAX_SYMBOL_LEN];
    Heap buyHeap;  // Max-Heap (highest price first)
    Heap sellHeap; // Min-Heap (lowest price first)
} OrderBook;

OrderBook orderBooks[100]; // Support up to 100 different symbols
int numOrderBooks = 0;

// Trade record
typedef struct {
    int tradeId;
    int buyOrderId;
    int sellOrderId;
    int buyerUserId;
    int sellerUserId;
    char symbol[MAX_SYMBOL_LEN];
    int quantity;
    double price;
    char timestamp[MAX_TIMESTAMP_LEN];
} Trade;

Trade trades[MAX_ORDERS];
int numTrades = 0;
int nextTradeId = 1;

// Function prototypes
void initHeap(Heap *heap);
void insertBuyOrder(Heap *heap, Order *order);
void insertSellOrder(Heap *heap, Order *order);
Order* extractMaxBuy(Heap *heap);
Order* extractMinSell(Heap *heap);
void heapifyUpBuy(Heap *heap, int index);
void heapifyDownBuy(Heap *heap, int index);
void heapifyUpSell(Heap *heap, int index);
void heapifyDownSell(Heap *heap, int index);
OrderBook* findOrCreateOrderBook(const char *symbol);
void matchOrders();
void loadOrdersFromCSV(const char *filename);
void saveMatchedTradesToCSV(const char *filename);
void printOrderBook(const char *symbol);
void getCurrentTimestamp(char *buffer, size_t bufferSize);

// Initialize heap
void initHeap(Heap *heap) {
    heap->size = 0;
}

// Get current timestamp
void getCurrentTimestamp(char *buffer, size_t bufferSize) {
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    strftime(buffer, bufferSize, "%Y-%m-%dT%H:%M:%S", t);
}

// Find or create order book for a symbol
OrderBook* findOrCreateOrderBook(const char *symbol) {
    for (int i = 0; i < numOrderBooks; i++) {
        if (strcmp(orderBooks[i].symbol, symbol) == 0) {
            return &orderBooks[i];
        }
    }
    
    // Create new order book
    if (numOrderBooks < 100) {
        strcpy(orderBooks[numOrderBooks].symbol, symbol);
        initHeap(&orderBooks[numOrderBooks].buyHeap);
        initHeap(&orderBooks[numOrderBooks].sellHeap);
        return &orderBooks[numOrderBooks++];
    }
    
    return NULL;
}

// Insert into Max-Heap (Buy Orders - highest price first)
void insertBuyOrder(Heap *heap, Order *order) {
    if (heap->size >= MAX_ORDERS) {
        printf("Error: Heap is full!\n");
        return;
    }
    
    heap->orders[heap->size] = order;
    heapifyUpBuy(heap, heap->size);
    heap->size++;
}

// Insert into Min-Heap (Sell Orders - lowest price first)
void insertSellOrder(Heap *heap, Order *order) {
    if (heap->size >= MAX_ORDERS) {
        printf("Error: Heap is full!\n");
        return;
    }
    
    heap->orders[heap->size] = order;
    heapifyUpSell(heap, heap->size);
    heap->size++;
}

// Heapify up for Max-Heap (Buy Orders)
void heapifyUpBuy(Heap *heap, int index) {
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (heap->orders[index]->price > heap->orders[parent]->price) {
            Order *temp = heap->orders[index];
            heap->orders[index] = heap->orders[parent];
            heap->orders[parent] = temp;
            index = parent;
        } else {
            break;
        }
    }
}

// Heapify down for Max-Heap (Buy Orders)
void heapifyDownBuy(Heap *heap, int index) {
    while (1) {
        int left = 2 * index + 1;
        int right = 2 * index + 2;
        int largest = index;
        
        if (left < heap->size && heap->orders[left]->price > heap->orders[largest]->price) {
            largest = left;
        }
        if (right < heap->size && heap->orders[right]->price > heap->orders[largest]->price) {
            largest = right;
        }
        
        if (largest != index) {
            Order *temp = heap->orders[index];
            heap->orders[index] = heap->orders[largest];
            heap->orders[largest] = temp;
            index = largest;
        } else {
            break;
        }
    }
}

// Heapify up for Min-Heap (Sell Orders)
void heapifyUpSell(Heap *heap, int index) {
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (heap->orders[index]->price < heap->orders[parent]->price) {
            Order *temp = heap->orders[index];
            heap->orders[index] = heap->orders[parent];
            heap->orders[parent] = temp;
            index = parent;
        } else {
            break;
        }
    }
}

// Heapify down for Min-Heap (Sell Orders)
void heapifyDownSell(Heap *heap, int index) {
    while (1) {
        int left = 2 * index + 1;
        int right = 2 * index + 2;
        int smallest = index;
        
        if (left < heap->size && heap->orders[left]->price < heap->orders[smallest]->price) {
            smallest = left;
        }
        if (right < heap->size && heap->orders[right]->price < heap->orders[smallest]->price) {
            smallest = right;
        }
        
        if (smallest != index) {
            Order *temp = heap->orders[index];
            heap->orders[index] = heap->orders[smallest];
            heap->orders[smallest] = temp;
            index = smallest;
        } else {
            break;
        }
    }
}

// Extract max from Buy Heap
Order* extractMaxBuy(Heap *heap) {
    if (heap->size == 0) return NULL;
    
    Order *max = heap->orders[0];
    heap->orders[0] = heap->orders[heap->size - 1];
    heap->size--;
    
    if (heap->size > 0) {
        heapifyDownBuy(heap, 0);
    }
    
    return max;
}

// Extract min from Sell Heap
Order* extractMinSell(Heap *heap) {
    if (heap->size == 0) return NULL;
    
    Order *min = heap->orders[0];
    heap->orders[0] = heap->orders[heap->size - 1];
    heap->size--;
    
    if (heap->size > 0) {
        heapifyDownSell(heap, 0);
    }
    
    return min;
}

// Load orders from CSV file
void loadOrdersFromCSV(const char *filename) {
    FILE *file = fopen(filename, "r");
    if (!file) {
        printf("Error: Could not open file %s\n", filename);
        return;
    }
    
    char line[MAX_LINE_LEN];
    fgets(line, sizeof(line), file); // Skip header
    
    while (fgets(line, sizeof(line), file)) {
        Order *order = (Order *)malloc(sizeof(Order));
        
        char *token = strtok(line, ",");
        order->orderId = atoi(token);
        
        token = strtok(NULL, ",");
        order->userId = atoi(token);
        
        token = strtok(NULL, ",");
        strcpy(order->symbol, token);
        
        token = strtok(NULL, ",");
        strcpy(order->type, token);
        
        token = strtok(NULL, ",");
        order->quantity = atoi(token);
        
        token = strtok(NULL, ",");
        order->price = atof(token);
        
        token = strtok(NULL, ",");
        strcpy(order->timestamp, token);
        
        token = strtok(NULL, ",\n");
        strcpy(order->status, token);
        
        // Add to appropriate order book
        OrderBook *book = findOrCreateOrderBook(order->symbol);
        if (book) {
            if (strcmp(order->type, "BUY") == 0) {
                insertBuyOrder(&book->buyHeap, order);
                printf("✅ Added BUY order: %s %d shares @ $%.2f\n", 
                       order->symbol, order->quantity, order->price);
            } else {
                insertSellOrder(&book->sellHeap, order);
                printf("✅ Added SELL order: %s %d shares @ $%.2f\n", 
                       order->symbol, order->quantity, order->price);
            }
        }
    }
    
    fclose(file);
}

// Match orders across all symbols
void matchOrders() {
    printf("\n🔄 Starting Order Matching Engine...\n\n");
    
    for (int i = 0; i < numOrderBooks; i++) {
        OrderBook *book = &orderBooks[i];
        
        printf("📊 Matching orders for %s:\n", book->symbol);
        
        while (book->buyHeap.size > 0 && book->sellHeap.size > 0) {
            Order *buyOrder = book->buyHeap.orders[0];  // Peek at top
            Order *sellOrder = book->sellHeap.orders[0]; // Peek at top
            
            // Check if buy price >= sell price (match condition)
            if (buyOrder->price >= sellOrder->price) {
                // Extract both orders
                extractMaxBuy(&book->buyHeap);
                extractMinSell(&book->sellHeap);
                
                // Calculate matched quantity
                int matchedQty = (buyOrder->quantity < sellOrder->quantity) 
                                 ? buyOrder->quantity : sellOrder->quantity;
                
                // Create trade record
                Trade trade;
                trade.tradeId = nextTradeId++;
                trade.buyOrderId = buyOrder->orderId;
                trade.sellOrderId = sellOrder->orderId;
                trade.buyerUserId = buyOrder->userId;
                trade.sellerUserId = sellOrder->userId;
                strcpy(trade.symbol, buyOrder->symbol);
                trade.quantity = matchedQty;
                trade.price = sellOrder->price; // Execute at sell price
                getCurrentTimestamp(trade.timestamp, MAX_TIMESTAMP_LEN);
                
                trades[numTrades++] = trade;
                
                printf("  ✨ MATCH! Trade #%d: %d shares @ $%.2f\n", 
                       trade.tradeId, matchedQty, trade.price);
                printf("     Buyer (User %d) ← → Seller (User %d)\n", 
                       buyOrder->userId, sellOrder->userId);
                
                // Update order quantities
                buyOrder->quantity -= matchedQty;
                sellOrder->quantity -= matchedQty;
                
                // Re-insert if partially filled
                if (buyOrder->quantity > 0) {
                    strcpy(buyOrder->status, "PARTIAL");
                    insertBuyOrder(&book->buyHeap, buyOrder);
                    printf("     ⚠️  Buy order partially filled, %d shares remaining\n", 
                           buyOrder->quantity);
                } else {
                    strcpy(buyOrder->status, "FILLED");
                    free(buyOrder);
                }
                
                if (sellOrder->quantity > 0) {
                    strcpy(sellOrder->status, "PARTIAL");
                    insertSellOrder(&book->sellHeap, sellOrder);
                    printf("     ⚠️  Sell order partially filled, %d shares remaining\n", 
                           sellOrder->quantity);
                } else {
                    strcpy(sellOrder->status, "FILLED");
                    free(sellOrder);
                }
                
            } else {
                // No match possible (buy price < sell price)
                printf("  ❌ No match: Best buy $%.2f < Best sell $%.2f\n", 
                       buyOrder->price, sellOrder->price);
                break;
            }
        }
        
        printf("\n");
    }
    
    printf("✅ Matching complete! Total trades: %d\n\n", numTrades);
}

// Save matched trades to CSV
void saveMatchedTradesToCSV(const char *filename) {
    FILE *file = fopen(filename, "w");
    if (!file) {
        printf("Error: Could not open file %s for writing\n", filename);
        return;
    }
    
    fprintf(file, "tradeId,buyOrderId,sellOrderId,buyerUserId,sellerUserId,symbol,quantity,price,timestamp\n");
    
    for (int i = 0; i < numTrades; i++) {
        fprintf(file, "%d,%d,%d,%d,%d,%s,%d,%.2f,%s\n",
                trades[i].tradeId,
                trades[i].buyOrderId,
                trades[i].sellOrderId,
                trades[i].buyerUserId,
                trades[i].sellerUserId,
                trades[i].symbol,
                trades[i].quantity,
                trades[i].price,
                trades[i].timestamp);
    }
    
    fclose(file);
    printf("💾 Saved %d trades to %s\n", numTrades, filename);
}

// Print order book for a symbol
void printOrderBook(const char *symbol) {
    OrderBook *book = findOrCreateOrderBook(symbol);
    if (!book) {
        printf("No order book found for %s\n", symbol);
        return;
    }
    
    printf("\n📖 ORDER BOOK for %s\n", symbol);
    printf("═══════════════════════════════════════\n");
    
    printf("\n🟢 BUY ORDERS (Max-Heap - Highest First):\n");
    printf("----------------------------------------\n");
    if (book->buyHeap.size == 0) {
        printf("  (No buy orders)\n");
    } else {
        for (int i = 0; i < book->buyHeap.size; i++) {
            Order *order = book->buyHeap.orders[i];
            printf("  Order #%d: %d shares @ $%.2f (User %d)\n",
                   order->orderId, order->quantity, order->price, order->userId);
        }
    }
    
    printf("\n🔴 SELL ORDERS (Min-Heap - Lowest First):\n");
    printf("----------------------------------------\n");
    if (book->sellHeap.size == 0) {
        printf("  (No sell orders)\n");
    } else {
        for (int i = 0; i < book->sellHeap.size; i++) {
            Order *order = book->sellHeap.orders[i];
            printf("  Order #%d: %d shares @ $%.2f (User %d)\n",
                   order->orderId, order->quantity, order->price, order->userId);
        }
    }
    
    printf("\n");
}

// Main function
int main() {
    printf("╔════════════════════════════════════════════════╗\n");
    printf("║   STOCK TRADING ORDER MATCHING ENGINE (C)     ║\n");
    printf("║   Heap-Based Order Matching System            ║\n");
    printf("╚════════════════════════════════════════════════╝\n\n");
    
    // Load orders from CSV
    printf("📂 Loading orders from CSV...\n\n");
    loadOrdersFromCSV("data/orders.csv");
    
    printf("\n");
    
    // Display order books before matching
    printf("📋 ORDER BOOKS BEFORE MATCHING:\n");
    printf("═══════════════════════════════════════════════\n");
    for (int i = 0; i < numOrderBooks; i++) {
        printOrderBook(orderBooks[i].symbol);
    }
    
    // Match orders
    matchOrders();
    
    // Display order books after matching
    printf("📋 ORDER BOOKS AFTER MATCHING:\n");
    printf("═══════════════════════════════════════════════\n");
    for (int i = 0; i < numOrderBooks; i++) {
        printOrderBook(orderBooks[i].symbol);
    }
    
    // Save trades
    saveMatchedTradesToCSV("data/trades.csv");
    
    // Display trade summary
    printf("\n📊 TRADE SUMMARY:\n");
    printf("════════════════════════════════════════���══════\n");
    for (int i = 0; i < numTrades; i++) {
        printf("Trade #%d: %s - %d shares @ $%.2f\n",
               trades[i].tradeId,
               trades[i].symbol,
               trades[i].quantity,
               trades[i].price);
        printf("  Buyer: User %d | Seller: User %d | Time: %s\n",
               trades[i].buyerUserId,
               trades[i].sellerUserId,
               trades[i].timestamp);
    }
    
    printf("\n✅ Matching engine execution complete!\n");
    
    return 0;
}
