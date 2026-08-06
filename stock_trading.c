#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <ctype.h>

#define MAX_SYMBOLS      120
#define MAX_ORDERS_PER   500
#define MAX_USERS        100
#define MAX_HOLDINGS     120
#define MAX_HISTORY      500
#define MAX_PENDING       50
#define SYM_LEN           12
#define NAME_LEN          64
#define PASS_LEN          64
#define ID_LEN            16
#define MAX_SHARES_ORDER 1000
#define START_BALANCE    500000.00f
#define CSV_FILE         "order_book.csv"
#define USER_FILE        "users.dat"

#define PRICE_BUMP_PCT   0.005f

typedef struct {
    char  order_id[ID_LEN];
    char  symbol[SYM_LEN];
    char  type[6];         
    float limit_price;
    int   total_qty;
    int   slice_qty;
    int   filled_qty;
    int   slices_done;
    int   active;
} IcebergOrder;

#define MAX_ICEBERG 30

typedef struct {
    char  sym[SYM_LEN];
    char  name[NAME_LEN];
} CompanyInfo;

static CompanyInfo CTABLE[] = {
    {"AAPL","Apple Inc."},                    {"MSFT","Microsoft Corporation"},
    {"GOOGL","Alphabet Inc. (Google)"},       {"AMZN","Amazon.com Inc."},
    {"TSLA","Tesla Inc."},                    {"META","Meta Platforms Inc."},
    {"NVDA","NVIDIA Corporation"},            {"NFLX","Netflix Inc."},
    {"INTC","Intel Corporation"},             {"AMD","Advanced Micro Devices"},
    {"BABA","Alibaba Group"},                 {"ORCL","Oracle Corporation"},
    {"IBM","Intl Business Machines"},         {"CSCO","Cisco Systems"},
    {"QCOM","Qualcomm Incorporated"},         {"ADBE","Adobe Inc."},
    {"CRM","Salesforce Inc."},                {"PYPL","PayPal Holdings"},
    {"UBER","Uber Technologies"},             {"LYFT","Lyft Inc."},
    {"SNAP","Snap Inc. (Snapchat)"},          {"TWTR","Twitter/X Corp"},
    {"SPOT","Spotify Technology"},            {"SHOP","Shopify Inc."},
    {"SQ","Block Inc."},                      {"ROKU","Roku Inc."},
    {"ZM","Zoom Video Communications"},       {"DOCU","DocuSign Inc."},
    {"PLTR","Palantir Technologies"},         {"RBLX","Roblox Corporation"},
    {"COIN","Coinbase Global"},               {"HOOD","Robinhood Markets"},
    {"AFRM","Affirm Holdings"},               {"SOFI","SoFi Technologies"},
    {"LCID","Lucid Group"},                   {"RIVN","Rivian Automotive"},
    {"NIO","NIO Inc."},                       {"XPEV","XPeng Inc."},
    {"LI","Li Auto Inc."},                    {"BYND","Beyond Meat"},
    {"SPCE","Virgin Galactic"},               {"DKNG","DraftKings Inc."},
    {"PENN","PENN Entertainment"},            {"CHGG","Chegg Inc."},
    {"DUOL","Duolingo Inc."},                 {"UPST","Upstart Holdings"},
    {"LMND","Lemonade Inc."},                 {"ROOT","Root Inc."},
    {"PTON","Peloton Interactive"},           {"FVRR","Fiverr International"},
    {"ETSY","Etsy Inc."},                     {"WMT","Walmart Inc."},
    {"CVNA","Carvana Co."},                   {"OPEN","Opendoor Technologies"},
    {"EXPI","eXp World Holdings"},            {"RDFN","Redfin Corporation"},
    {"COMP","Compass Inc."},                  {"HOUS","Anywhere Real Estate"},
    {"ABNB","Airbnb Inc."},                   {"DASH","DoorDash Inc."},
    {"GRAB","Grab Holdings"},                 {"SEA","Sea Limited"},
    {"DIDI","DiDi Global"},                   {"MELI","MercadoLibre Inc."},
    {"NU","Nu Holdings (Nubank)"},            {"STNE","StoneCo Ltd."},
    {"PAGS","PagSeguro Digital"},             {"GLOB","Globant S.A."},
    {"ARCO","Arcos Dorados (McD LATAM)"},     {"DESP","Despegar.com"},
    {"VIST","Vista Energy"},                  {"LOMA","Loma Negra"},
    {"CEPU","Central Puerto"},                {"IRSA","IRSA Inversiones"},
    {"BIOX","Bioceres Crop Solutions"},       {"AGRO","Adecoagro S.A."},
    {"CAAP","Corporacion America Airports"},  {"VALE","Vale S.A."},
    {"PBR","Petrobras S.A."},                 {"ITUB","Itau Unibanco"},
    {"BBD","Banco Bradesco"},                 {"BRKM","Braskem S.A."},
    {"SUZB","Suzano S.A."},                   {"MGLU","Magazine Luiza"},
    {"RENT","Localiza Rent a Car"},           {"BEEF","Minerva Foods"},
    {"GOLD","Barrick Gold Corporation"},      {"AEM","Agnico Eagle Mines"},
    {"KGC","Kinross Gold Corporation"},       {"AG","First Majestic Silver"},
    {"HL","Hecla Mining Company"},            {"CDE","Coeur Mining"},
    {"FSM","Fortuna Silver Mines"},           {"EXK","Endeavour Silver"},
    {"GPL","Great Panther Mining"},           {"MAG","MAG Silver Corp."},
    {"RIOT","Riot Platforms"},                {"MARA","Marathon Digital"},
    {"HUT","Hut 8 Mining Corp."},             {"BITF","Bitfarms Ltd."},
    {"",""}
};

const char *get_name(const char *sym) {
    for (int i = 0; CTABLE[i].sym[0]; i++)
        if (strcmp(CTABLE[i].sym, sym) == 0) return CTABLE[i].name;
    return "Unknown";
}

typedef struct {
    char  order_id[ID_LEN];
    float price;
    int   quantity;
    int   queue_pos;
} HeapNode;

typedef struct { HeapNode data[MAX_ORDERS_PER]; int size; } MinHeap;

static void mswap(MinHeap *h, int i, int j) {
    HeapNode t = h->data[i]; h->data[i] = h->data[j]; h->data[j] = t;
}
void min_push(MinHeap *h, HeapNode n) {
    if (h->size >= MAX_ORDERS_PER) return;
    h->data[h->size] = n;
    int i = h->size++;
    while (i > 0) {
        int p = (i-1)/2;
        if (h->data[p].price > h->data[i].price ||
           (h->data[p].price == h->data[i].price &&
            h->data[p].queue_pos > h->data[i].queue_pos))
            { mswap(h,p,i); i=p; } else break;
    }
}
HeapNode min_pop(MinHeap *h) {
    HeapNode top = h->data[0];
    h->data[0] = h->data[--h->size];
    int i = 0;
    while (1) {
        int l=2*i+1, r=2*i+2, s=i;
        if (l<h->size && (h->data[l].price < h->data[s].price ||
           (h->data[l].price==h->data[s].price && h->data[l].queue_pos<h->data[s].queue_pos))) s=l;
        if (r<h->size && (h->data[r].price < h->data[s].price ||
           (h->data[r].price==h->data[s].price && h->data[r].queue_pos<h->data[s].queue_pos))) s=r;
        if (s==i) break;
        mswap(h,i,s); i=s;
    }
    return top;
}

typedef struct { HeapNode data[MAX_ORDERS_PER]; int size; } MaxHeap;

static void xswap(MaxHeap *h, int i, int j) {
    HeapNode t = h->data[i]; h->data[i] = h->data[j]; h->data[j] = t;
}
void max_push(MaxHeap *h, HeapNode n) {
    if (h->size >= MAX_ORDERS_PER) return;
    h->data[h->size] = n;
    int i = h->size++;
    while (i > 0) {
        int p = (i-1)/2;
        if (h->data[p].price < h->data[i].price ||
           (h->data[p].price == h->data[i].price &&
            h->data[p].queue_pos > h->data[i].queue_pos))
            { xswap(h,p,i); i=p; } else break;
    }
}
HeapNode max_pop(MaxHeap *h) {
    HeapNode top = h->data[0];
    h->data[0] = h->data[--h->size];
    int i = 0;
    while (1) {
        int l=2*i+1, r=2*i+2, s=i;
        if (l<h->size && (h->data[l].price > h->data[s].price ||
           (h->data[l].price==h->data[s].price && h->data[l].queue_pos<h->data[s].queue_pos))) s=l;
        if (r<h->size && (h->data[r].price > h->data[s].price ||
           (h->data[r].price==h->data[s].price && h->data[r].queue_pos<h->data[s].queue_pos))) s=r;
        if (s==i) break;
        xswap(h,i,s); i=s;
    }
    return top;
}

/* ══════════════════════════════════ STOCK ORDER BOOK ══════════════════════════════ */
typedef struct {
    char    symbol[SYM_LEN];
    MinHeap sell_heap;
    MaxHeap buy_heap;
    float   ref_price;
    float   vwap_price;
    long    vwap_volume;
    float   live_price;
} StockBook;

static StockBook books[MAX_SYMBOLS];
static int       book_count = 0;

StockBook *find_book(const char *sym) {
    for (int i = 0; i < book_count; i++)
        if (strcmp(books[i].symbol, sym) == 0) return &books[i];
    return NULL;
}
StockBook *get_or_create_book(const char *sym) {
    StockBook *b = find_book(sym);
    if (b) return b;
    if (book_count >= MAX_SYMBOLS) return NULL;
    b = &books[book_count++];
    memset(b, 0, sizeof(StockBook));
    strncpy(b->symbol, sym, SYM_LEN-1);
    return b;
}
static void trim(char *s) {
    int n = (int)strlen(s);
    while (n>0 && (s[n-1]=='\r'||s[n-1]=='\n'||s[n-1]==' '||s[n-1]=='\t')) s[--n]=0;
    int st=0; while(s[st]==' '||s[st]=='\t') st++;
    if(st) memmove(s,s+st,strlen(s)-st+1);
}
int load_csv(const char *filename) {
    FILE *f = fopen(filename, "r");
    if (!f) {
        printf("\n  [ERROR] Cannot open '%s'.\n", filename);
        printf("  → Rename your CSV to 'order_book.csv' and place it in the same folder.\n");
        return 0;
    }
    char line[512];
    int  loaded=0, skipped=0, is_hdr=1;
    float   psum[MAX_SYMBOLS];
    int     pcnt[MAX_SYMBOLS];
    double  vwap_sum[MAX_SYMBOLS];
    long    vwap_vol[MAX_SYMBOLS];
    memset(psum,     0, sizeof(psum));
    memset(pcnt,     0, sizeof(pcnt));
    memset(vwap_sum, 0, sizeof(vwap_sum));
    memset(vwap_vol, 0, sizeof(vwap_vol));
    while (fgets(line, sizeof(line), f)) {
        if (is_hdr) { is_hdr=0; continue; }
        char buf[512]; strncpy(buf, line, 511); buf[511]=0;
        char *tok;
        char  oid[ID_LEN]="", sym[SYM_LEN]="", otype[6]="", status[12]="";
        int   qpos=0, qty=0;
        float price=0, exec_price=0;

        tok=strtok(buf,",");  if(!tok){skipped++;continue;} trim(tok); strncpy(oid,tok,ID_LEN-1);
        tok=strtok(NULL,","); if(!tok){skipped++;continue;} trim(tok); strncpy(sym,tok,SYM_LEN-1);
        tok=strtok(NULL,","); if(!tok){skipped++;continue;} qpos=atoi(tok);
        tok=strtok(NULL,","); if(!tok){skipped++;continue;} trim(tok); strncpy(otype,tok,5);
        tok=strtok(NULL,","); if(!tok){skipped++;continue;} qty=atoi(tok);
        tok=strtok(NULL,","); if(!tok){skipped++;continue;} price=(float)atof(tok);
        tok=strtok(NULL,","); if(tok){trim(tok); strncpy(status,tok,12);}
        tok=strtok(NULL,","); if(tok){trim(tok); strncpy(status,tok,11);}
        tok=strtok(NULL,",");
        tok=strtok(NULL,","); if(tok) exec_price=(float)atof(tok);

        if(qty<=0 || price<=0.0f || sym[0]==0) {skipped++; continue;}

        StockBook *book = get_or_create_book(sym);
        if(!book) {skipped++; continue;}

        HeapNode node;
        strncpy(node.order_id, oid, ID_LEN-1);
        node.price     = price;
        node.quantity  = qty;
        node.queue_pos = qpos;

        if      (strcmp(otype,"SELL")==0) min_push(&book->sell_heap, node);
        else if (strcmp(otype,"BUY" )==0) max_push(&book->buy_heap,  node);
        else { skipped++; continue; }

        int idx = (int)(book - books);
        psum[idx] += price;
        pcnt[idx]++;

        if (strcmp(status,"MATCHED")==0 && exec_price > 0.0f) {
            vwap_sum[idx] += (double)exec_price * qty;
            vwap_vol[idx] += qty;
        }
        loaded++;
    }
    fclose(f);

    for (int i = 0; i < book_count; i++) {
        books[i].ref_price   = (pcnt[i]>0)     ? psum[i]/(float)pcnt[i]           : 0;
        books[i].vwap_price  = (vwap_vol[i]>0) ? (float)(vwap_sum[i]/vwap_vol[i]) : books[i].ref_price;
        books[i].vwap_volume = vwap_vol[i];
        books[i].live_price  = books[i].vwap_price;
    }

    printf("  ✓ Loaded %d orders across %d symbol(s). (%d skipped)\n",
           loaded, book_count, skipped);
    return 1;
}

typedef struct {
    char  symbol[SYM_LEN];
    float avg_buy_price;
    int   quantity;
} Holding;

typedef struct {
    char  order_id[ID_LEN];
    char  symbol[SYM_LEN];
    char  type[6];
    float exec_price;
    int   quantity;
    float pnl;
} TradeRecord;

typedef struct {
    char  order_id[ID_LEN];
    char  symbol[SYM_LEN];
    char  type[6];
    float limit_price;
    int   quantity;
    int   active;
} PendingOrder;

static int pend_id_counter   = 1;
static int iceberg_id_counter = 1;

typedef struct {
    char         username[NAME_LEN];
    char         password[PASS_LEN];
    int          is_admin;
    float        balance;
    Holding      portfolio[MAX_HOLDINGS];
    int          port_count;
    TradeRecord  history[MAX_HISTORY];
    int          hist_count;
    PendingOrder pending[MAX_PENDING];
    int          pend_count;
    IcebergOrder icebergs[MAX_ICEBERG];
    int          iceberg_count;
} User;

static User  users[MAX_USERS];
static int   user_count = 0;
static User *me = NULL;

void save_users(void) {
    FILE *f = fopen(USER_FILE,"wb"); if(!f) return;
    fwrite(&user_count, sizeof(int),  1,          f);
    fwrite(users,       sizeof(User), user_count, f);
    fclose(f);
}
void load_users(void) {
    FILE *f = fopen(USER_FILE,"rb"); if(!f){user_count=0;return;}
    if(fread(&user_count,sizeof(int),1,f)!=1){user_count=0;fclose(f);return;}
    if(user_count<0||user_count>MAX_USERS){user_count=0;fclose(f);return;}
    fread(users, sizeof(User), user_count, f);
    fclose(f);
}
User *find_user(const char *u) {
    for(int i=0;i<user_count;i++) if(strcmp(users[i].username,u)==0) return &users[i];
    return NULL;
}
void seed_admin(void) {
    if(find_user("admin")) return;
    if(user_count>=MAX_USERS) return;
    User *a = &users[user_count++];
    memset(a,0,sizeof(User));
    strcpy(a->username,"admin"); strcpy(a->password,"admin@123");
    a->is_admin=1; a->balance=9999999.00f;
    save_users();
}

Holding *find_holding(User *u, const char *sym) {
    for(int i=0;i<u->port_count;i++)
        if(strcmp(u->portfolio[i].symbol,sym)==0) return &u->portfolio[i];
    return NULL;
}
void add_holding(User *u, const char *sym, float price, int qty) {
    Holding *h = find_holding(u,sym);
    if(h) {
        float tot = h->avg_buy_price*h->quantity + price*qty;
        h->quantity += qty; h->avg_buy_price = tot/h->quantity;
    } else {
        if(u->port_count>=MAX_HOLDINGS) return;
        Holding *n = &u->portfolio[u->port_count++];
        strncpy(n->symbol,sym,SYM_LEN-1);
        n->avg_buy_price=price; n->quantity=qty;
    }
}
void reduce_holding(User *u, const char *sym, int qty) {
    for(int i=0;i<u->port_count;i++){
        if(strcmp(u->portfolio[i].symbol,sym)==0){
            u->portfolio[i].quantity -= qty;
            if(u->portfolio[i].quantity<=0)
                u->portfolio[i]=u->portfolio[--u->port_count];
            return;
        }
    }
}
void add_trade(User *u, const char *oid, const char *sym,
               const char *type, float price, int qty, float pnl) {
    if(u->hist_count>=MAX_HISTORY) return;
    TradeRecord *tr = &u->history[u->hist_count++];
    strncpy(tr->order_id,oid,ID_LEN-1);
    strncpy(tr->symbol,sym,SYM_LEN-1);
    strncpy(tr->type,type,5);
    tr->exec_price=price; tr->quantity=qty; tr->pnl=pnl;
}

void add_pending(User *u, const char *sym, const char *type,
                 float limit_price, int qty) {
    if(u->pend_count >= MAX_PENDING) {
        printf("  [WARN] Pending order slot full (%d max).\n", MAX_PENDING);
        return;
    }
    PendingOrder *p = &u->pending[u->pend_count++];
    snprintf(p->order_id, ID_LEN, "PND%05d", pend_id_counter++);
    strncpy(p->symbol,     sym,  SYM_LEN-1);
    strncpy(p->type,       type, 5);
    p->limit_price = limit_price;
    p->quantity    = qty;
    p->active      = 1;
    save_users();
    printf("\n  ╔══════════════════════════════════════════════╗\n");
    printf("  ║         📌  PENDING ORDER CREATED            ║\n");
    printf("  ╠══════════════════════════════════════════════╣\n");
    printf("  ║  Order ID    : %-28s ║\n", p->order_id);
    printf("  ║  Stock       : %-6s — %-20s ║\n", sym, get_name(sym));
    printf("  ║  Type        : %-28s ║\n", type);
    printf("  ║  Limit Price : $%-27.2f ║\n", limit_price);
    printf("  ║  Quantity    : %-28d ║\n", qty);
    printf("  ╠══════════════════════════════════════════════╣\n");
    printf("  ║  ℹ  Will execute when market hits your price ║\n");
    printf("  ║     View in Dashboard → Pending Orders       ║\n");
    printf("  ╚══════════════════════════════════════════════╝\n");
}

/* ════════════════════════════════════ AUTH ════════════════════════════════════════ */
static void to_upper(char *s){while(*s){*s=(char)toupper((unsigned char)*s);s++;}}

void do_register(void) {
    char un[NAME_LEN], pw[PASS_LEN], pw2[PASS_LEN];
    printf("\n  ┌─────────────────────────────────┐\n");
    printf("  │      NEW USER REGISTRATION      │\n");
    printf("  └─────────────────────────────────┘\n");
    printf("  Username   : "); scanf("%63s",un);
    if(strcmp(un,"admin")==0){printf("  [ERROR] 'admin' is reserved.\n");return;}
    if(find_user(un)){printf("  [ERROR] Username already taken.\n");return;}
    printf("  Password   : "); scanf("%63s",pw);
    printf("  Confirm Pw : "); scanf("%63s",pw2);
    if(strcmp(pw,pw2)!=0){printf("  [ERROR] Passwords do not match.\n");return;}
    if(user_count>=MAX_USERS){printf("  [ERROR] User limit reached.\n");return;}
    User *u = &users[user_count++];
    memset(u,0,sizeof(User));
    strncpy(u->username,un,NAME_LEN-1);
    strncpy(u->password,pw,PASS_LEN-1);
    u->is_admin=0; u->balance=START_BALANCE;
    save_users();
    printf("\n  ✓ Account created! Starting balance: $%.2f\n", START_BALANCE);
}

int do_login(void) {
    char un[NAME_LEN], pw[PASS_LEN];
    printf("\n  ┌─────────────────────────────────┐\n");
    printf("  │             LOGIN               │\n");
    printf("  └─────────────────────────────────┘\n");
    printf("  Username : "); scanf("%63s",un);
    printf("  Password : "); scanf("%63s",pw);
    User *u = find_user(un);
    if(!u||strcmp(u->password,pw)!=0){printf("  [ERROR] Invalid credentials.\n");return 0;}
    me = u;
    if(u->is_admin) printf("\n  ✓ Welcome ADMIN — full system access. 🔐\n");
    else printf("\n  ✓ Welcome, %s!  Balance: $%.2f\n", u->username, u->balance);
    return 1;
}

/* ════════════════════════════ DISPLAY HELPERS ════════════════════════════════════ */
void div_line(void){printf("  ──────────────────────────────────────────────────────────\n");}

void display_companies(void) {
    printf("\n  ╔═════╦════════╦══════════════════════════════════╦════════════╦════════════╦════════════╗\n");
    printf("  ║ No  ║ Symbol ║ Company                          ║ Best Ask $ ║ Best Bid $ ║ Live Mkt $ ║\n");
    printf("  ╠═════╬════════╬══════════════════════════════════╬════════════╬════════════╬════════════╣\n");
    for(int i=0;i<book_count;i++){
        StockBook *b = &books[i];
        float ask = (b->sell_heap.size>0) ? b->sell_heap.data[0].price : 0.0f;
        float bid = (b->buy_heap.size >0) ? b->buy_heap.data[0].price  : 0.0f;
        printf("  ║ %-3d ║ %-6s ║ %-32s ║ %10.2f ║ %10.2f ║ %10.2f ║\n",
               i+1, b->symbol, get_name(b->symbol), ask, bid, b->live_price);
    }
    printf("  ╚═════╩════════╩══════════════════════════════════╩════════════╩════════════╩════════════╝\n");
    printf("  Best Ask  = cheapest SELL order  (lowest you can buy at)\n");
    printf("  Best Bid  = highest  BUY  order  (most you earn when selling)\n");
    printf("  Live Mkt  = current market price (rises as buyers consume sellers)\n\n");
}

void show_order_book(const char *sym) {
    StockBook *b = find_book(sym);
    if(!b){printf("  [ERROR] '%s' not in order book.\n",sym);return;}
    MinHeap ss = b->sell_heap;
    MaxHeap bs = b->buy_heap;
    int show = 5;
    printf("\n  ORDER BOOK  —  %s  (%s)\n", sym, get_name(sym));
    printf("  Original VWAP: $%.2f   |   Live Market: $%.2f   |   Best Ask: $%.2f   |   Best Bid: $%.2f\n",
           b->vwap_price, b->live_price,
           b->sell_heap.size>0 ? b->sell_heap.data[0].price : 0,
           b->buy_heap.size >0 ? b->buy_heap.data[0].price  : 0);
    printf("  ┌────────────────────────────────────┬────────────────────────────────────┐\n");
    printf("  │  SELL (Ask) — Min-Heap              │  BUY  (Bid) — Max-Heap             │\n");
    printf("  ├─────────────────┬───────────────────┼─────────────────┬───────────────────┤\n");
    printf("  │   Ask Price $   │   Qty Available   │   Bid Price $   │   Qty Available   │\n");
    printf("  ├─────────────────┼───────────────────┼─────────────────┼───────────────────┤\n");
    for(int i=0;i<show;i++){
        char ap[20]="       —       ", aq[20]="        —        ";
        char bp[20]="       —       ", bq[20]="        —        ";
        if(ss.size>0){HeapNode n=min_pop(&ss);snprintf(ap,20,"%15.2f",n.price);snprintf(aq,20,"%17d",n.quantity);}
        if(bs.size>0){HeapNode n=max_pop(&bs);snprintf(bp,20,"%15.2f",n.price);snprintf(bq,20,"%17d",n.quantity);}
        printf("  │%s  │%s  │%s  │%s  │\n",ap,aq,bp,bq);
    }
    printf("  └─────────────────┴───────────────────┴─────────────────┴───────────────────┘\n");
    printf("  Remaining SELL orders: %d   |   Remaining BUY orders: %d\n",
           b->sell_heap.size, b->buy_heap.size);
}

void display_portfolio(void){
    printf("\n  ╔══════════════════════════════════════════════════════════════════════════╗\n");
    printf("  ║  PORTFOLIO — %-18s      Balance: $%-14.2f      ║\n",
           me->username, me->balance);
    printf("  ╠════════╦═════╦════════════╦════════════╦══════════════╦═══════════════╣\n");
    printf("  ║ Symbol ║ Qty ║ Avg Buy $  ║ Live Mkt $ ║  Mkt Value $ ║ Unrealized P&L║\n");
    printf("  ╠════════╬═════╬════════════╬════════════╬══════════════╬═══════════════╣\n");
    float total = me->balance;
    if(me->port_count==0)
        printf("  ║  (no current holdings)                                                  ║\n");
    for(int i=0;i<me->port_count;i++){
        Holding *h = &me->portfolio[i];
        StockBook *b = find_book(h->symbol);
        float lp   = (b) ? b->live_price : h->avg_buy_price;
        float mval = lp * h->quantity;
        float unr  = (lp - h->avg_buy_price) * h->quantity;
        total += mval;
        printf("  ║ %-6s ║%4d ║%10.2f  ║%10.2f  ║%12.2f  ║%+13.2f  ║\n",
               h->symbol, h->quantity, h->avg_buy_price, lp, mval, unr);
    }
    printf("  ╠════════╩═════╩════════════╩════════════╩══════════════╩═══════════════╣\n");
    printf("  ║  Total Value (Cash + Holdings): $%-14.2f                           ║\n",total);
    printf("  ╚══════════════════════════════════════════════════════════════════════════╝\n");
}

void display_history(void){
    if(me->hist_count==0){printf("  No trades yet.\n");return;}
    printf("\n  ╔════╦══════════════╦══════╦═════╦══════════╦═════╦═════════════╗\n");
    printf("  ║ #  ║  Order ID    ║ Sym  ║Type ║ Price $  ║ Qty ║   P&L $     ║\n");
    printf("  ╠════╬══════════════╬══════╬═════╬══════════╬═════╬═════════════╣\n");
    for(int i=0;i<me->hist_count;i++){
        TradeRecord *tr = &me->history[i];
        printf("  ║%-3d ║ %-12s ║ %-4s ║ %-3s ║%8.2f  ║%4d ║%+11.2f  ║\n",
               i+1, tr->order_id, tr->symbol, tr->type,
               tr->exec_price, tr->quantity, tr->pnl);
    }
    printf("  ╚════╩══════════════╩══════╩═════╩══════════╩═════╩═════════════╝\n");
}

void view_pending(void) {
    int active = 0;
    for(int i=0;i<me->pend_count;i++) if(me->pending[i].active) active++;
    printf("\n  ╔══════════════════════════════════════════════════════════════════════╗\n");
    printf("  ║   ⏳  PENDING ORDERS — %-20s  (%d active)         ║\n",
           me->username, active);
    printf("  ╠══════╦══════════════╦════════╦══════╦════════════════╦══════════╣\n");
    printf("  ║  #   ║  Order ID    ║ Symbol ║ Type ║  Limit Price $ ║   Qty    ║\n");
    printf("  ╠══════╬══════════════╬════════╬══════╬════════════════╬══════════╣\n");
    if(active == 0) {
        printf("  ║  (no active pending orders)                                      ║\n");
    } else {
        int n = 0;
        for(int i=0;i<me->pend_count;i++){
            PendingOrder *p = &me->pending[i];
            if(!p->active) continue;
            n++;
            printf("  ║ %-4d ║ %-12s ║ %-6s ║ %-4s ║ %14.2f ║ %8d ║\n",
                   n, p->order_id, p->symbol, p->type,
                   p->limit_price, p->quantity);
        }
    }
    printf("  ╚══════╩══════════════╩════════╩══════╩════════════════╩══════════╝\n");
    if(active == 0) return;
    printf("\n  Cancel a pending order? (Enter Order ID or 0 to skip): ");
    char cid[ID_LEN]; scanf("%15s", cid);
    if(strcmp(cid,"0")==0) return;
    for(int i=0;i<me->pend_count;i++){
        if(strcmp(me->pending[i].order_id, cid)==0 && me->pending[i].active){
            me->pending[i].active = 0;
            printf("  ✓ Pending order %s cancelled.\n", cid);
            save_users(); return;
        }
    }
    printf("  [ERROR] Order ID '%s' not found or already inactive.\n", cid);
}

static int iceberg_buy_wave(StockBook *b, float limit_px, int wave_qty,
                             float *cost_out, int wave_num) {
    int bought = 0;
    float cost = 0.0f;
    int rem = wave_qty;
    float orig = b->vwap_price;

    printf("  │ Wave %-2d │ Buying up to %-4d share(s) @ limit $%-9.2f        │\n",
           wave_num, wave_qty, limit_px);
    printf("  ├──────────────────────────────────────────────────────────────┤\n");

    int prev_exhausted = 0;
    int prev_shares = 0;

    while (rem > 0 && b->sell_heap.size > 0) {
        float ask = b->sell_heap.data[0].price;
        if (ask > limit_px) {
            printf("  │  ⛔ Ask $%.2f exceeds your limit $%.2f — wave stops.%*s│\n",
                   ask, limit_px,
                   (int)(14 - (int)snprintf(NULL,0,"  ⛔ Ask $%.2f exceeds your limit $%.2f — wave stops.",ask,limit_px))," ");
            break;
        }
        if (me->balance < ask) {
            printf("  │  ⛔ Insufficient balance ($%.2f) for 1 share @ $%.2f%*s│\n",
                   me->balance, ask,
                   (int)(12 - (int)snprintf(NULL,0,"  ⛔ Insufficient balance ($%.2f) for 1 share @ $%.2f",me->balance,ask))," ");
            break;
        }
        if (prev_exhausted && prev_shares > 0) {
            float bump = b->live_price * PRICE_BUMP_PCT * prev_shares;
            b->live_price += bump;
            printf("  │  ⬆ Seller exhausted — market bumped +$%.4f → $%.2f%*s│\n",
                   bump, b->live_price,
                   (int)(12 - (int)snprintf(NULL,0,"  ⬆ Seller exhausted — market bumped +$%.4f → $%.2f",bump,b->live_price))," ");
            prev_exhausted = 0; prev_shares = 0;
        }
        HeapNode f = min_pop(&b->sell_heap);
        int fq = (rem <= f.quantity) ? rem : f.quantity;
        int afford = (int)(me->balance / f.price);
        if (fq > afford) fq = afford;
        if (fq <= 0) break;

        float fc = f.price * fq;
        printf("  │  ✔ %-12s  %4d share(s) @ $%8.2f  (mkt was $%8.2f) │\n",
               f.order_id, fq, f.price, orig);

        cost += fc; bought += fq; rem -= fq; me->balance -= fc;
        prev_shares += fq;

        if (f.quantity > fq) {
            f.quantity -= fq;
            min_push(&b->sell_heap, f);
            prev_exhausted = 0;
        } else {
            prev_exhausted = 1;
        }
    }
    if (prev_exhausted && prev_shares > 0) {
        float bump = b->live_price * PRICE_BUMP_PCT * prev_shares;
        b->live_price += bump;
    }
    *cost_out = cost;
    return bought;
}

/* Internal: execute one slice of an iceberg SELL wave */
static int iceberg_sell_wave(StockBook *b, float limit_px, int wave_qty,
                              float avg_buy_px, float *rev_out, int wave_num) {
    int sold = 0;
    float rev = 0.0f;
    int rem = wave_qty;

    printf("  │ Wave %-2d │ Selling up to %-4d share(s) @ limit $%-8.2f        │\n",
           wave_num, wave_qty, limit_px);
    printf("  ├──────────────────────────────────────────────────────────────┤\n");

    while (rem > 0 && b->buy_heap.size > 0) {
        float bid = b->buy_heap.data[0].price;
        if (bid < limit_px) {
            printf("  │  ⛔ Bid $%.2f below your limit $%.2f — wave stops.%*s│\n",
                   bid, limit_px,
                   (int)(15 - (int)snprintf(NULL,0,"  ⛔ Bid $%.2f below your limit $%.2f — wave stops.",bid,limit_px))," ");
            break;
        }
        HeapNode f = max_pop(&b->buy_heap);
        int fq = (rem <= f.quantity) ? rem : f.quantity;
        float fr = f.price * fq;
        printf("  │  ✔ %-12s  %4d share(s) @ $%8.2f  (pnl/sh: %+.2f)  │\n",
               f.order_id, fq, f.price, f.price - avg_buy_px);
        rev += fr; sold += fq; rem -= fq; me->balance += fr;
        if (f.quantity > fq) {
            f.quantity -= fq;
            max_push(&b->buy_heap, f);
        }
    }
    *rev_out = rev;
    return sold;
}
void execute_iceberg(void) {
    if (me->iceberg_count >= MAX_ICEBERG) {
        printf("  [ERROR] Max iceberg orders (%d) reached.\n", MAX_ICEBERG);
        return;
    }
    printf("\n  ╔══════════════════════════════════════════════════════════════════╗\n");
    printf("  ║  🧊  ICEBERG ORDER — Hidden-Size Execution Engine               ║\n");
    printf("  ╠══════════════════════════════════════════════════════════════════╣\n");
    printf("  ║  An iceberg order hides your full position. Only a small        ║\n");
    printf("  ║  visible 'slice' is shown to the market at a time.             ║\n");
    printf("  ║  When each slice fills, the next slice is automatically        ║\n");
    printf("  ║  released until your entire hidden quantity is traded.          ║\n");
    printf("  ╚══════════════════════════════════════════════════════════════════╝\n\n");

    char sym[SYM_LEN] = {0};
    printf("  Stock symbol (e.g. AAPL): "); scanf("%11s", sym); to_upper(sym);
    StockBook *b = find_book(sym);
    if (!b) { printf("  [ERROR] '%s' not in order book.\n", sym); return; }

    /* ── Direction ── */
    printf("\n  Direction:\n");
    printf("  ┌─────────────────────────────────────┐\n");
    printf("  │  1.  BUY   (buy hidden quantity)    │\n");
    printf("  │  2.  SELL  (sell hidden quantity)   │\n");
    printf("  │  0.  Cancel                         │\n");
    printf("  └─────────────────────────────────────┘\n");
    printf("  Choice > "); int dir; scanf("%d", &dir);
    if (dir == 0) { printf("  Cancelled.\n"); return; }
    if (dir != 1 && dir != 2) { printf("  [ERROR] Invalid.\n"); return; }
    const char *type = (dir == 1) ? "BUY" : "SELL";

    /* For SELL: check holdings */
    Holding *hld = NULL;
    if (dir == 2) {
        hld = find_holding(me, sym);
        if (!hld) { printf("  [ERROR] You do not hold '%s'.\n", sym); return; }
        if (b->buy_heap.size == 0) {
            printf("  [ERROR] No BUY orders in book for '%s'.\n", sym); return;
        }
        printf("\n  You hold %d share(s) of %s @ avg $%.2f\n",
               hld->quantity, sym, hld->avg_buy_price);
    } else {
        if (b->sell_heap.size == 0) {
            printf("  [ERROR] No SELL orders available for '%s'.\n", sym); return;
        }
    }

    /* ── Show live market info ── */
    printf("\n  ┌──────────────────────────────────────────────────┐\n");
    printf("  │  %s — %s\n", sym, get_name(sym));
    printf("  │  VWAP (original)  : $%.2f\n", b->vwap_price);
    printf("  │  Live Market      : $%.2f\n", b->live_price);
    if (dir == 1)
        printf("  │  Best Ask (P1)    : $%.2f  ← lowest you can buy at\n",
               b->sell_heap.size > 0 ? b->sell_heap.data[0].price : 0.0f);
    else
        printf("  │  Best Bid (P1)    : $%.2f  ← highest you can sell at\n",
               b->buy_heap.size > 0 ? b->buy_heap.data[0].price  : 0.0f);
    printf("  │  Your Balance     : $%.2f\n", me->balance);
    printf("  └──────────────────────────────────────────────────┘\n\n");

    /* ── Total quantity ── */
    int max_total = (dir == 2 && hld) ? hld->quantity : (MAX_SHARES_ORDER * 10);
    printf("  Total hidden quantity (shares) [1–%d]: ", max_total);
    int total_qty; scanf("%d", &total_qty);
    if (total_qty <= 0) { printf("  [ERROR] Must be > 0.\n"); return; }
    if (dir == 2 && total_qty > hld->quantity) {
        printf("  [ERROR] You only hold %d share(s).\n", hld->quantity); return;
    }
    if (dir == 1 && total_qty > MAX_SHARES_ORDER * 10) {
        printf("  [WARN] Capped to %d.\n", MAX_SHARES_ORDER * 10);
        total_qty = MAX_SHARES_ORDER * 10;
    }

    /* ── Slice size ── */
    printf("\n  Visible slice size per wave [1–%d]:\n", total_qty);
    printf("  (e.g. if total=900, slice=100 → 9 waves of 100)\n");
    printf("  Slice size: ");
    int slice_qty; scanf("%d", &slice_qty);
    if (slice_qty <= 0 || slice_qty > total_qty) {
        printf("  [ERROR] Invalid slice size.\n"); return;
    }

    /* ── Limit price ── */
    float limit_px;
    if (dir == 1) {
        printf("\n  Max price per share you're willing to pay (limit): $");
        scanf("%f", &limit_px);
        if (limit_px <= 0) { printf("  [ERROR] Invalid price.\n"); return; }
        float p1 = b->sell_heap.size > 0 ? b->sell_heap.data[0].price : 0;
        if (limit_px < p1)
            printf("  [WARN] Your limit $%.2f < best ask $%.2f — order may not fill.\n",
                   limit_px, p1);
    } else {
        printf("\n  Minimum price per share you'll accept (limit): $");
        scanf("%f", &limit_px);
        if (limit_px <= 0) { printf("  [ERROR] Invalid price.\n"); return; }
        float p1 = b->buy_heap.size > 0 ? b->buy_heap.data[0].price : 0;
        if (limit_px > p1)
            printf("  [WARN] Your limit $%.2f > best bid $%.2f — order may not fill.\n",
                   limit_px, p1);
    }

    /* ── Confirmation ── */
    int num_waves = (total_qty + slice_qty - 1) / slice_qty;
    printf("\n  ╔══════════════════════════════════════════════════════════════╗\n");
    printf("  ║  🧊  ICEBERG ORDER SUMMARY — CONFIRM TO EXECUTE             ║\n");
    printf("  ╠══════════════════════════════════════════════════════════════╣\n");
    printf("  ║  Stock        : %-6s  —  %-33s║\n", sym, get_name(sym));
    printf("  ║  Direction    : %-44s║\n", type);
    printf("  ║  Total Hidden : %-4d share(s)%-34s║\n", total_qty, "");
    printf("  ║  Slice Size   : %-4d share(s) visible per wave%-14s║\n", slice_qty, "");
    printf("  ║  Num Waves    : %-4d (last wave may be partial)%-11s║\n", num_waves, "");
    printf("  ║  Limit Price  : $%-9.2f per share%-27s║\n", limit_px, "");
    printf("  ╠══════════════════════════════════════════════════════════════╣\n");
    if (dir == 1)
        printf("  ║  Max Exposure : $%-12.2f (if all fills at limit)%-9s║\n",
               limit_px * total_qty, "");
    printf("  ╚══════════════════════════════════════════════════════════════╝\n");
    printf("\n  Confirm? (1=Yes / 0=No): "); int cf; scanf("%d", &cf);
    if (cf != 1) { printf("  Cancelled.\n"); return; }

    /* ═══════════════════════ EXECUTE WAVES ═══════════════════════════════════ */
    printf("\n  ╔══════════════════════════════════════════════════════════════════╗\n");
    printf("  ║  🌊  WAVE EXECUTION LOG                                         ║\n");
    printf("  ╠══════════════════════════════════════════════════════════════════╣\n");

    int   total_filled = 0;
    float total_cost   = 0.0f;
    float total_rev    = 0.0f;
    float avg_buy_px   = (hld) ? hld->avg_buy_price : 0.0f;
    int   wave_num     = 1;
    int   rem_total    = total_qty;
    char  last_oid[ID_LEN] = "ICE";

    while (rem_total > 0) {
        int this_slice = (rem_total < slice_qty) ? rem_total : slice_qty;

        printf("  ├──────────────────────────────────────────────────────────────┤\n");

        if (dir == 1) {
            /* BUY wave */
            float cost = 0.0f;
            int filled = iceberg_buy_wave(b, limit_px, this_slice, &cost, wave_num);
            if (filled > 0) {
                float wavg = cost / filled;
                add_holding(me, sym, wavg, filled);
                snprintf(last_oid, ID_LEN, "ICE%04dW%02d", iceberg_id_counter % 10000, wave_num % 100);
                add_trade(me, last_oid, sym, "BUY", wavg, filled, 0.0f);
                total_filled += filled;
                total_cost   += cost;
                rem_total    -= filled;
                printf("  │  Wave %-2d complete: %d/%d filled @ avg $%.2f%*s│\n",
                       wave_num, total_filled, total_qty, wavg,
                       (int)(14 - (int)snprintf(NULL,0,"  │  Wave %-2d complete: %d/%d filled @ avg $%.2f",
                       wave_num,total_filled,total_qty,wavg))," ");
                if (filled < this_slice) {
                    printf("  │  ⚠ Only %d/%d filled this wave — book dry or limit hit%*s│\n",
                           filled, this_slice,
                           (int)(8-(int)snprintf(NULL,0,"  │  ⚠ Only %d/%d filled this wave — book dry or limit hit",filled,this_slice))," ");
                    break;
                }
            } else {
                printf("  │  ⚠ Wave %-2d: 0 filled — no liquidity at limit $%.2f%*s│\n",
                       wave_num, limit_px,
                       (int)(12-(int)snprintf(NULL,0,"  │  ⚠ Wave %-2d: 0 filled — no liquidity at limit $%.2f",wave_num,limit_px))," ");
                break;
            }
        } else {
            /* SELL wave */
            float rev = 0.0f;
            int filled = iceberg_sell_wave(b, limit_px, this_slice, avg_buy_px, &rev, wave_num);
            if (filled > 0) {
                float wavg = rev / filled;
                float wpnl = rev - avg_buy_px * filled;
                reduce_holding(me, sym, filled);
                snprintf(last_oid, ID_LEN, "ICE%04dW%02d", iceberg_id_counter % 10000, wave_num % 100);
                add_trade(me, last_oid, sym, "SELL", wavg, filled, wpnl);
                total_filled += filled;
                total_rev    += rev;
                rem_total    -= filled;
                /* refresh hld pointer since reduce_holding may compact */
                hld = find_holding(me, sym);
                printf("  │  Wave %-2d complete: %d/%d filled @ avg $%.2f  pnl %+.2f%*s│\n",
                       wave_num, total_filled, total_qty, wavg, wpnl,
                       (int)(4-(int)snprintf(NULL,0,"  │  Wave %-2d complete: %d/%d filled @ avg $%.2f  pnl %+.2f",
                       wave_num,total_filled,total_qty,wavg,wpnl))," ");
                if (filled < this_slice) {
                    printf("  │  ⚠ Only %d/%d filled this wave — book dry or limit hit%*s│\n",
                           filled, this_slice,
                           (int)(8-(int)snprintf(NULL,0,"  │  ⚠ Only %d/%d filled this wave — book dry or limit hit",filled,this_slice))," ");
                    break;
                }
            } else {
                printf("  │  ⚠ Wave %-2d: 0 filled — no bids at limit $%.2f%*s│\n",
                       wave_num, limit_px,
                       (int)(14-(int)snprintf(NULL,0,"  │  ⚠ Wave %-2d: 0 filled — no bids at limit $%.2f",wave_num,limit_px))," ");
                break;
            }
        }
        wave_num++;
    }

    printf("  ╚══════════════════════════════════════════════════════════════════╝\n");

    /* ── Save remainder as pending iceberg if not fully filled ── */
    if (rem_total > 0 && me->iceberg_count < MAX_ICEBERG) {
        IcebergOrder *ice = &me->icebergs[me->iceberg_count++];
        snprintf(ice->order_id, ID_LEN, "ICE%05d", iceberg_id_counter);
        strncpy(ice->symbol,    sym,  SYM_LEN-1);
        strncpy(ice->type,      type, 5);
        ice->limit_price  = limit_px;
        ice->total_qty    = total_qty;
        ice->slice_qty    = slice_qty;
        ice->filled_qty   = total_filled;
        ice->slices_done  = wave_num - 1;
        ice->active       = 1;
    }
    iceberg_id_counter++;
    save_users();

    /* ── Final summary ── */
    printf("\n"); div_line();
    printf("  🧊  ICEBERG ORDER FINAL SUMMARY\n"); div_line();
    printf("  Symbol          : %s — %s\n", sym, get_name(sym));
    printf("  Direction       : %s\n", type);
    printf("  Total Requested : %d share(s)\n", total_qty);
    printf("  Total Filled    : %d share(s)  (%.1f%%)\n",
           total_filled, total_qty > 0 ? (float)total_filled/total_qty*100.0f : 0.0f);
    printf("  Remaining       : %d share(s)%s\n", rem_total,
           rem_total > 0 ? "  (saved as pending iceberg)" : "  ✅ fully filled");
    printf("  Waves Executed  : %d\n", wave_num - 1);
    if (dir == 1 && total_filled > 0)
        printf("  Avg Price Paid  : $%.2f\n  Total Cost      : $%.2f\n  New Balance     : $%.2f\n",
               total_cost/total_filled, total_cost, me->balance);
    if (dir == 2 && total_filled > 0) {
        float pnl = total_rev - avg_buy_px * total_filled;
        printf("  Avg Sell Price  : $%.2f\n  Total Revenue   : $%.2f\n",
               total_rev/total_filled, total_rev);
        if (pnl >= 0)
            printf("  Total P&L       : +$%.2f  🟢\n", pnl);
        else
            printf("  Total P&L       : -$%.2f  🔴\n", -pnl);
        printf("  New Balance     : $%.2f\n", me->balance);
    }
    printf("  Live Market     : $%.2f\n", b->live_price);
    div_line();
}

/* ── View iceberg orders ── */
void view_icebergs(void) {
    int active = 0;
    for (int i = 0; i < me->iceberg_count; i++)
        if (me->icebergs[i].active) active++;

    printf("\n  ╔══════════════════════════════════════════════════════════════════════════════════╗\n");
    printf("  ║  🧊  ICEBERG ORDERS — %-20s  (%d active)                    ║\n",
           me->username, active);
    printf("  ╠══════╦══════════════╦════════╦══════╦══════════╦═══════╦═══════╦════════╦════════╣\n");
    printf("  ║  #   ║  Order ID    ║ Symbol ║ Type ║ Limit $  ║ Total ║Filled ║ Slice  ║ Waves  ║\n");
    printf("  ╠══════╬══════════════╬════════╬══════╬══════════╬═══════╬═══════╬════════╬════════╣\n");

    if (active == 0) {
        printf("  ║  (no active iceberg orders)                                                      ║\n");
    } else {
        int n = 0;
        for (int i = 0; i < me->iceberg_count; i++) {
            IcebergOrder *ice = &me->icebergs[i];
            if (!ice->active) continue;
            n++;
            printf("  ║ %-4d ║ %-12s ║ %-6s ║ %-4s ║%8.2f  ║%6d ║%6d ║%7d ║%7d ║\n",
                   n, ice->order_id, ice->symbol, ice->type,
                   ice->limit_price, ice->total_qty,
                   ice->filled_qty, ice->slice_qty, ice->slices_done);
        }
    }
    printf("  ╚══════╩══════════════╩════════╩══════╩══════════╩═══════╩═══════╩════════╩════════╝\n");

    if (active == 0) return;
    printf("\n  Cancel an iceberg order? (Enter Order ID or 0 to skip): ");
    char cid[ID_LEN]; scanf("%15s", cid);
    if (strcmp(cid, "0") == 0) return;
    for (int i = 0; i < me->iceberg_count; i++) {
        if (strcmp(me->icebergs[i].order_id, cid) == 0 && me->icebergs[i].active) {
            me->icebergs[i].active = 0;
            printf("  ✓ Iceberg order %s cancelled.\n", cid);
            save_users(); return;
        }
    }
    printf("  [ERROR] Order ID '%s' not found or already inactive.\n", cid);
}


void execute_buy_sym(const char *sym) {
    StockBook *b = find_book(sym);
    if(!b) { printf("  [ERROR] '%s' not in order book.\n", sym); return; }
    if(b->sell_heap.size == 0) {
        printf("  [ERROR] No SELL orders available for %s.\n", sym); return;
    }

    float orig_market = b->vwap_price;
    float lowest_ask  = b->sell_heap.data[0].price;

    printf("\n  ══════════════════════════════════════════════════════════════\n");
    printf("  BUYING  :  %s  —  %s\n", sym, get_name(sym));
    printf("  ══════════════════════════════════════════════════════════════\n");
    printf("  Original Market Price (VWAP)  : $%.2f\n", orig_market);
    printf("  ★ Lowest you can buy at (P1)  : $%.2f\n", lowest_ask);
    printf("  Live Market Price             : $%.2f\n", b->live_price);
    printf("  Your Balance                  : $%.2f\n", me->balance);
    printf("  SELL orders available         : %d\n\n",  b->sell_heap.size);
    printf("  ℹ  Limit is auto-set to P1 ($%.2f).\n", lowest_ask);
    printf("  ℹ  If P1 seller runs out, next seller fills the rest (price may rise).\n\n");

    printf("  ⚠  Max %d shares per order.\n", MAX_SHARES_ORDER);
    printf("  How many shares to buy? (1–%d): ", MAX_SHARES_ORDER);
    int qty; scanf("%d", &qty);
    if(qty<=0){ printf("  [ERROR] Quantity must be > 0.\n"); return; }
    if(qty>MAX_SHARES_ORDER){
        printf("  [WARN] Capped to %d.\n", MAX_SHARES_ORDER);
        qty = MAX_SHARES_ORDER;
    }

    if(me->balance < lowest_ask){
        printf("  [ERROR] Balance $%.2f is insufficient even for 1 share @ $%.2f.\n",
               me->balance, lowest_ask);
        return;
    }

    int   rem=qty, bought=0, priority=1;
    float cost=0;
    char  last_oid[ID_LEN]="AUTOBUY";
    int   prev_priority_exhausted = 0;
    int   shares_from_prev = 0;

    printf("\n  ┌─────────────────────────────────────────────────────────────────┐\n");
    printf("  │  Share  │  Seller ID   │  You Pay $  │  Orig Mkt $ │  Diff $     │\n");
    printf("  ├─────────┼──────────────┼─────────────┼─────────────┼─────────────┤\n");

    while(rem > 0 && b->sell_heap.size > 0) {
        if(prev_priority_exhausted && shares_from_prev > 0) {
            float bump = b->live_price * PRICE_BUMP_PCT * shares_from_prev;
            b->live_price += bump;
            printf("  ├─────────────────────────────────────────────────────────────────┤\n");
            printf("  │  ⬆ P%d seller exhausted — market up $%.4f → $%.2f%*s│\n",
                   priority-1, bump, b->live_price,
                   (int)(14 - (int)snprintf(NULL,0,"  ⬆ P%d seller exhausted — market up $%.4f → $%.2f",
                   priority-1,bump,b->live_price)), " ");
            printf("  ├─────────────────────────────────────────────────────────────────┤\n");
            prev_priority_exhausted = 0;
            shares_from_prev = 0;
        }

        if(me->balance < b->sell_heap.data[0].price){
            printf("  │  [STOP] Balance $%.2f < next ask $%.2f%*s│\n",
                   me->balance, b->sell_heap.data[0].price,
                   (int)(28-(int)snprintf(NULL,0,"  [STOP] Balance $%.2f < next ask $%.2f",
                   me->balance,b->sell_heap.data[0].price))," ");
            break;
        }
        int afford = (int)(me->balance / b->sell_heap.data[0].price);
        if(afford <= 0) break;
        if(rem > afford) rem = afford;

        HeapNode f   = min_pop(&b->sell_heap);
        int      fq  = (rem <= f.quantity) ? rem : f.quantity;

        for(int s = 1; s <= fq; s++){
            float diff = f.price - orig_market;
            printf("  │  %4d     │  %-12s│  %11.2f│  %11.2f│  %+11.2f│\n",
                   bought+s, f.order_id, f.price, orig_market, diff);
        }

        float fc = f.price * fq;
        cost += fc; bought += fq; rem -= fq;
        me->balance -= fc;
        shares_from_prev += fq;
        strncpy(last_oid, f.order_id, ID_LEN-1);

        if(f.quantity > fq){
            f.quantity -= fq;
            min_push(&b->sell_heap, f);
            prev_priority_exhausted = 0;
        } else {
            prev_priority_exhausted = 1;
        }
        priority++;
    }

    printf("  └─────────────────────────────────────────────────────────────────┘\n");

    if(bought == 0){ printf("  [INFO] No shares purchased.\n"); return; }

    float avg = cost / bought;
    add_holding(me, sym, avg, bought);
    add_trade(me, last_oid, sym, "BUY", avg, bought, 0.0f);

    if(rem > 0){
        if(b->sell_heap.size == 0)
            printf("\n  ⚠  %d share(s) unfilled — order book exhausted.\n", rem);
        else
            printf("\n  ⚠  %d share(s) unfilled — insufficient balance.\n", rem);
    }

    if(prev_priority_exhausted && shares_from_prev > 0){
        float bump = b->live_price * PRICE_BUMP_PCT * shares_from_prev;
        b->live_price += bump;
        printf("  ⬆ Market adjusted: +$%.4f → Live Price now $%.2f\n", bump, b->live_price);
    }

    save_users();
    printf("\n"); div_line();
    printf("  ✅  BUY CONFIRMATION  —  %s (%s)\n", sym, get_name(sym)); div_line();
    printf("  Shares Bought       : %d\n",      bought);
    printf("  Avg Price Paid      : $%.2f\n",   avg);
    printf("  Original Mkt Price  : $%.2f\n",   orig_market);
    printf("  Price vs Orig Mkt   : %+.2f (%+.2f%%)\n",
           avg - orig_market,
           orig_market > 0 ? (avg - orig_market)/orig_market*100.0f : 0.0f);
    printf("  Total Cost          : $%.2f\n",   cost);
    printf("  New Balance         : $%.2f\n",   me->balance);
    printf("  Live Market Price   : $%.2f\n",   b->live_price);
    div_line();
}

/* ═════════════════════════════ EXECUTE SELL (core) ════════════════════════════════ */
void execute_sell_sym(const char *sym) {
    Holding *h = find_holding(me, sym);
    if(!h){ printf("  [ERROR] You do not hold '%s'.\n", sym); return; }

    StockBook *b = find_book(sym);
    if(!b || b->buy_heap.size==0){
        printf("  [ERROR] No BUY orders in book for '%s'.\n", sym); return;
    }

    printf("\n  ══════════════════════════════════════════════════════════════\n");
    printf("  SELLING :  %s  —  %s\n", sym, get_name(sym));
    printf("  ══════════════════════════════════════════════════════════════\n");
    printf("  Your Holding            : %d share(s) @ avg buy $%.2f\n",
           h->quantity, h->avg_buy_price);
    printf("  Market Price (Best Bid) : $%.2f\n", b->buy_heap.data[0].price);
    printf("  Live Market Price       : $%.2f\n", b->live_price);
    printf("  Original VWAP           : $%.2f  (vol: %ld)\n",
           b->vwap_price, b->vwap_volume);
    printf("  BUY orders in book      : %d\n\n",  b->buy_heap.size);

    int max_can_sell = (h->quantity < MAX_SHARES_ORDER) ? h->quantity : MAX_SHARES_ORDER;
    printf("  How do you want to sell?\n");
    printf("  ┌──────────────────────────────────────────────────────────┐\n");
    printf("  │  1.  Market Price  ($%.2f — execute immediately)       │\n",
           b->buy_heap.data[0].price);
    printf("  │  2.  Custom Limit Price  (set your minimum sell price)  │\n");
    printf("  │  0.  Cancel                                              │\n");
    printf("  └──────────────────────────────────────────────────────────┘\n");
    printf("  Choice > ");
    int mode; scanf("%d", &mode);
    if(mode==0){ printf("  Cancelled.\n"); return; }
    if(mode!=1 && mode!=2){ printf("  [ERROR] Invalid choice.\n"); return; }

    printf("\n  ⚠  You hold %d share(s). Max per order: %d.\n",
           h->quantity, MAX_SHARES_ORDER);
    printf("  How many shares to sell? (1–%d): ", max_can_sell);
    int qty; scanf("%d", &qty);
    if(qty<=0 || qty>h->quantity){ printf("  [ERROR] Invalid quantity.\n"); return; }
    if(qty>MAX_SHARES_ORDER){ printf("  [WARN] Capped to %d.\n",MAX_SHARES_ORDER); qty=MAX_SHARES_ORDER; }

    float user_limit;

    if(mode == 2) {
        printf("  Enter your minimum SELL price: $");
        scanf("%f", &user_limit);
        if(user_limit <= 0){ printf("  [ERROR] Invalid price.\n"); return; }
        if(user_limit > b->buy_heap.data[0].price) {
            printf("\n  ⚠  Your price $%.2f > highest bid $%.2f — no immediate match.\n",
                   user_limit, b->buy_heap.data[0].price);
            add_pending(me, sym, "SELL", user_limit, qty);
            return;
        }
        printf("\n  ✅ Matching now (P1 → P2 → ...).\n\n");
    } else {
        user_limit = 0.0f;
        show_order_book(sym);
        printf("\n  Matching at MARKET PRICE...\n\n");
    }

    int   rem=qty, sold=0, priority=1;
    float rev=0;
    char  last_oid[ID_LEN]="MKTSELL";

    while(rem>0 && b->buy_heap.size>0) {
        HeapNode best = b->buy_heap.data[0];
        if(best.price < user_limit) {
            printf("  ⚠  P%d bid $%.2f below your min $%.2f — stopping.\n",
                   priority, best.price, user_limit);
            break;
        }
        HeapNode f = max_pop(&b->buy_heap);
        int fq     = (rem <= f.quantity) ? rem : f.quantity;
        float fr   = f.price * fq;
        printf("  ✔  P%-2d | %-12s | %4d share(s) @ $%9.2f  →  $%11.2f\n",
               priority, f.order_id, fq, f.price, fr);
        rev += fr; sold += fq; rem -= fq;
        strncpy(last_oid, f.order_id, ID_LEN-1);
        if(f.quantity > fq){ f.quantity -= fq; max_push(&b->buy_heap, f); }
        priority++;
    }

    if(sold == 0){ printf("  [INFO] No shares sold.\n"); return; }

    float avg_s  = rev / sold;
    float basis  = h->avg_buy_price * sold;
    float pnl    = rev - basis;
    float pct    = (basis > 0) ? (pnl/basis)*100.0f : 0.0f;

    me->balance += rev;
    reduce_holding(me, sym, sold);
    add_trade(me, last_oid, sym, "SELL", avg_s, sold, pnl);

    if(rem > 0 && mode == 2) {
        printf("\n  ⚠  %d share(s) unmatched. Adding to PENDING.\n", rem);
        add_pending(me, sym, "SELL", user_limit, rem);
    } else if(rem > 0) {
        printf("  ⚠  %d share(s) unfilled — order book exhausted.\n", rem);
    }

    save_users();
    printf("\n"); div_line();
    printf("  ✅  SELL CONFIRMATION\n"); div_line();
    printf("  Symbol      : %s — %s\n", sym, get_name(sym));
    printf("  Shares Sold : %d\n",       sold);
    printf("  Avg Sell Px : $%.2f\n",    avg_s);
    printf("  Avg Buy  Px : $%.2f\n",    h->avg_buy_price);
    printf("  Revenue     : $%.2f\n",    rev);
    printf("  Cost Basis  : $%.2f\n",    basis);
    printf("  ─────────────────────────────────────────────────────────\n");
    if(pnl >= 0)
        printf("  ★  PROFIT : +$%.2f  (+%.2f%%)  ▲ 🟢\n",  pnl,  pct);
    else
        printf("  ✗  LOSS   : -$%.2f  (%.2f%%)   ▼ 🔴\n", -pnl, fabsf(pct));
    printf("  New Balance : $%.2f\n", me->balance);
    div_line();
}

/* ─── Wrappers ─── */
void execute_buy(void) {
    char sym[SYM_LEN]={0};
    printf("\n  Enter stock symbol (e.g. AAPL): "); scanf("%11s",sym); to_upper(sym);
    execute_buy_sym(sym);
}
void execute_sell(void) {
    if(me->port_count==0){printf("  [INFO] You have no holdings to sell.\n");return;}
    display_portfolio();
    char sym[SYM_LEN]={0};
    printf("\n  Enter stock symbol to sell: "); scanf("%11s",sym); to_upper(sym);
    execute_sell_sym(sym);
}

/* ══════════════════════════════ BROWSE & TRADE ════════════════════════════════════ */
void browse_and_trade(void) {
    display_companies();
    printf("  Enter company number (1–%d, 0 to go back): ", book_count);
    int num; scanf("%d",&num);
    if(num==0) return;
    if(num<1||num>book_count){ printf("  [ERROR] Invalid number.\n"); return; }

    char sym[SYM_LEN];
    strncpy(sym, books[num-1].symbol, SYM_LEN-1);
    StockBook *b = &books[num-1];

    printf("\n  ╔══════════════════════════════════════════════════════════════╗\n");
    printf("  ║  [%3d]  %-6s  —  %-37s  ║\n", num, sym, get_name(sym));
    printf("  ╠══════════════════════════════════════════════════════════════╣\n");
    printf("  ║  Original Market (VWAP) : $%-10.2f                       ║\n", b->vwap_price);
    printf("  ║  ★ Lowest Ask (buy at)  : $%-10.2f                       ║\n",
           b->sell_heap.size>0 ? b->sell_heap.data[0].price : 0);
    printf("  ║  Best Bid  (sell at)    : $%-10.2f                       ║\n",
           b->buy_heap.size >0 ? b->buy_heap.data[0].price  : 0);
    printf("  ║  Live Market Price      : $%-10.2f                       ║\n", b->live_price);
    printf("  ╠══════════════════════════════════════════════════════════════╣\n");
    printf("  ║  1.  BUY  (auto-fills at lowest ask)                        ║\n");
    printf("  ║  2.  SELL this stock                                         ║\n");
    printf("  ║  3.  View full Order Book                                    ║\n");
    printf("  ║  4.  🧊  Place ICEBERG order (hidden-size)                  ║\n");
    printf("  ║  0.  Back                                                    ║\n");
    printf("  ╚══════════════════════════════════════════════════════════════╝\n");
    printf("  Choice > ");
    int ch; scanf("%d",&ch);
    switch(ch){
        case 1: execute_buy_sym(sym);  break;
        case 2: execute_sell_sym(sym); break;
        case 3: show_order_book(sym);  break;
        case 4: execute_iceberg();     break;
        case 0: return;
        default: printf("  Invalid choice.\n");
    }
}

/* ══════════════════════════════════ ADMIN PANEL ═══════════════════════════════════ */
void admin_list_users(void){
    printf("\n  ╔═════╦══════════════════════╦═══════════════╦═════════╦════════╦═══════╗\n");
    printf("  ║  #  ║  Username            ║  Balance $    ║Holdings ║ Trades ║ Admin ║\n");
    printf("  ╠═════╬══════════════════════╬═══════════════╬═════════╬════════╬═══════╣\n");
    for(int i=0;i<user_count;i++){
        User *u=&users[i];
        printf("  ║ %-3d ║ %-20s ║ %13.2f ║ %7d ║ %6d ║ %-5s ║\n",
               i+1,u->username,u->balance,u->port_count,u->hist_count,
               u->is_admin?"YES":"no");
    }
    printf("  ╚═════╩══════════════════════╩═══════════════╩═════════╩════════╩═══════╝\n");
    printf("  Total users: %d\n",user_count);
}
void admin_inspect(void){
    char un[NAME_LEN]; printf("  Username: ");scanf("%63s",un);
    User *u=find_user(un); if(!u){printf("  [ERROR] Not found.\n");return;}
    User *sv=me; me=u; display_portfolio(); display_history(); me=sv;
}
void admin_reset_pw(void){
    char un[NAME_LEN],np[PASS_LEN];
    printf("  Username: ");scanf("%63s",un);
    User *u=find_user(un); if(!u){printf("  Not found.\n");return;}
    if(u->is_admin){printf("  Cannot reset admin password.\n");return;}
    printf("  New password: ");scanf("%63s",np);
    strncpy(u->password,np,PASS_LEN-1); save_users();
    printf("  ✓ Password reset for '%s'.\n",un);
}
void admin_set_bal(void){
    char un[NAME_LEN]; float amt;
    printf("  Username: ");scanf("%63s",un);
    User *u=find_user(un); if(!u){printf("  Not found.\n");return;}
    printf("  New balance [$]: ");scanf("%f",&amt);
    u->balance=amt; save_users();
    printf("  ✓ Balance set to $%.2f for '%s'.\n",amt,un);
}
void admin_del_user(void){
    char un[NAME_LEN],cf[8];
    printf("  Username to DELETE: ");scanf("%63s",un);
    if(strcmp(un,"admin")==0){printf("  Cannot delete admin.\n");return;}
    int idx=-1;
    for(int i=0;i<user_count;i++) if(strcmp(users[i].username,un)==0){idx=i;break;}
    if(idx<0){printf("  Not found.\n");return;}
    printf("  Type YES to confirm: ");scanf("%7s",cf);
    if(strcmp(cf,"YES")!=0){printf("  Cancelled.\n");return;}
    users[idx]=users[--user_count]; save_users();
    printf("  ✓ Deleted '%s'.\n",un);
}
void admin_book_stats(void){
    printf("\n  ╔═════╦════════╦══════════════╦══════════════╦══════════════╦═════════════════════╦══════════╦══════════╗\n");
    printf("  ║ No  ║ Symbol ║  VWAP Orig $ ║  Live Mkt $  ║  Ref Price $ ║ Company             ║ SellOrds ║ BuyOrds  ║\n");
    printf("  ╠═════╬════════╬══════════════╬══════════════╬══════════════╬═════════════════════╬══════════╬══════════╣\n");
    for(int i=0;i<book_count;i++){
        StockBook *b=&books[i];
        printf("  ║ %-3d ║ %-6s ║ %12.2f ║ %12.2f ║ %12.2f ║ %-19.19s ║ %8d ║ %8d ║\n",
               i+1,b->symbol,b->vwap_price,b->live_price,b->ref_price,
               get_name(b->symbol),b->sell_heap.size,b->buy_heap.size);
    }
    printf("  ╚═════╩════════╩══════════════╩══════════════╩══════════════╩═════════════════════╩══════════╩══════════╝\n");
}
void admin_vwap_detail(void){
    printf("\n  VWAP  =  Σ(ExecPrice × Qty)  /  Σ(Qty)  for all MATCHED orders\n\n");
    printf("  ╔═════╦════════╦══════════════╦══════════════╦═══════════════╦══════════════════════════════════╗\n");
    printf("  ║ No  ║ Symbol ║   VWAP $     ║  Live Mkt $  ║  Matched Vol  ║ Company                          ║\n");
    printf("  ╠═════╬════════╬══════════════╬══════════════╬═══════════════╬══════════════════════════════════╣\n");
    for(int i=0;i<book_count;i++){
        StockBook *b=&books[i];
        printf("  ║ %-3d ║ %-6s ║ %12.2f ║ %12.2f ║ %13ld ║ %-32s ║\n",
               i+1,b->symbol,b->vwap_price,b->live_price,b->vwap_volume,get_name(b->symbol));
    }
    printf("  ╚═════╩════════╩══════════════╩══════════════╩═══════════════╩══════════════════════════════════╝\n");
}

void admin_panel(void){
    int ch;
    while(1){
        printf("\n  ╔══════════════════════════════════════════╗\n");
        printf("  ║      🔐  ADMIN CONTROL PANEL             ║\n");
        printf("  ╠══════════════════════════════════════════╣\n");
        printf("  ║  1.   List All Users                     ║\n");
        printf("  ║  2.   Inspect User Portfolio & History   ║\n");
        printf("  ║  3.   Reset Any User's Password          ║\n");
        printf("  ║  4.   Set Any User's Balance             ║\n");
        printf("  ║  5.   Delete a User                      ║\n");
        printf("  ║  6.   Order Book Stats (all symbols)     ║\n");
        printf("  ║  7.   View Single Stock Order Book       ║\n");
        printf("  ║  8.   All Companies + Live Prices        ║\n");
        printf("  ║  9.   VWAP Detail (all stocks)           ║\n");
        printf("  ║  10.  Logout                             ║\n");
        printf("  ╚══════════════════════════════════════════╝\n");
        printf("  Admin > "); scanf("%d",&ch);
        switch(ch){
            case 1:  admin_list_users(); break;
            case 2:  admin_inspect();    break;
            case 3:  admin_reset_pw();   break;
            case 4:  admin_set_bal();    break;
            case 5:  admin_del_user();   break;
            case 6:  admin_book_stats(); break;
            case 7: {
                char sym[SYM_LEN]; printf("  Symbol: ");scanf("%11s",sym);to_upper(sym);
                show_order_book(sym); break;
            }
            case 8:  display_companies(); break;
            case 9:  admin_vwap_detail(); break;
            case 10: printf("  Admin logged out.\n"); me=NULL; return;
            default: printf("  Invalid.\n");
        }
    }
}

/* ══════════════════════════════ TRADING DASHBOARD ════════════════════════════════ */
void trading_dashboard(void){
    int ch;
    while(1){
        int pactive=0;
        for(int i=0;i<me->pend_count;i++) if(me->pending[i].active) pactive++;
        int iactive=0;
        for(int i=0;i<me->iceberg_count;i++) if(me->icebergs[i].active) iactive++;

        printf("\n  ╔════════════════════════════════════════════════╗\n");
        printf("  ║  📈  TRADING DASHBOARD                         ║\n");
        printf("  ║  User    : %-24s          ║\n", me->username);
        printf("  ║  Balance : $%-24.2f      ║\n",  me->balance);
        if(pactive>0)
        printf("  ║  ⏳ Pending Orders  : %-3d                      ║\n", pactive);
        if(iactive>0)
        printf("  ║  🧊 Iceberg Orders  : %-3d                      ║\n", iactive);
        printf("  ╠════════════════════════════════════════════════╣\n");
        printf("  ║  1.  Browse Companies & Trade  (pick by #)     ║\n");
        printf("  ║  2.  BUY  a stock  (enter symbol directly)     ║\n");
        printf("  ║  3.  SELL a stock  (enter symbol directly)     ║\n");
        printf("  ║  4.  🧊  Place ICEBERG order (hidden-size)     ║\n");
        printf("  ║  5.  My Portfolio                              ║\n");
        printf("  ║  6.  Trade History                             ║\n");
        printf("  ║  7.  Pending Orders  (view / cancel)           ║\n");
        printf("  ║  8.  🧊  Iceberg Orders  (view / cancel)       ║\n");
        printf("  ║  9.  View Order Book  (single stock)           ║\n");
        printf("  ║  10. Logout                                    ║\n");
        printf("  ╚════════════════════════════════════════════════╝\n");
        printf("  Choice > "); scanf("%d",&ch);
        switch(ch){
            case 1:  browse_and_trade();  break;
            case 2:  execute_buy();       break;
            case 3:  execute_sell();      break;
            case 4:  execute_iceberg();   break;
            case 5:  display_portfolio(); break;
            case 6:  display_history();   break;
            case 7:  view_pending();      break;
            case 8:  view_icebergs();     break;
            case 9: {
                char sym[SYM_LEN]; printf("  Symbol: ");scanf("%11s",sym);to_upper(sym);
                show_order_book(sym); break;
            }
            case 10:
                save_users();
                printf("  Logged out. Goodbye, %s! 👋\n", me->username);
                me=NULL; return;
            default: printf("  Invalid choice.\n");
        }
    }
}

/* ══════════════════════════════════ ENTRY POINT ═══════════════════════════════════ */
int main(void){
    printf("\n");
    printf("  ████████████████████████████████████████████████████████████\n");
    printf("  █                                                          █\n");
    printf("  █    STOCK TRADING ENGINE  ·  CSV ORDER BOOK  v3          █\n");
    printf("  █    Min-Heap (Sell)  ·  Max-Heap (Buy)  ·  Live Pricing  █\n");
    printf("  █    Auto-Lowest Buy  ·  Priority Cascade  ·  VWAP        █\n");
    printf("  █    🧊 Iceberg Orders  ·  Slice-by-Slice Execution        █\n");
    printf("  █    Max %d shares/order  ·  $%.0f starting balance     █\n",
           MAX_SHARES_ORDER, (double)START_BALANCE);
    printf("  █                                                          █\n");
    printf("  ████████████████████████████████████████████████████████████\n\n");

    printf("  Loading '%s'...\n", CSV_FILE);
    if(!load_csv(CSV_FILE)) return 1;
    printf("  %d stocks loaded and ready.\n\n", book_count);

    load_users();
    seed_admin();

    printf("  ┌──────────────────────────────────────────────────┐\n");
    printf("  │  ADMIN LOGIN  →  username: admin  pw: admin@123  │\n");
    printf("  └──────────────────────────────────────────────────┘\n");

    int ch;
    while(1){
        printf("\n  ┌────────────────────┐\n");
        printf("  │  1.  Register      │\n");
        printf("  │  2.  Login         │\n");
        printf("  │  3.  Exit          │\n");
        printf("  └────────────────────┘\n");
        printf("  > "); scanf("%d",&ch);
        switch(ch){
            case 1: do_register(); break;
            case 2:
                if(do_login()){
                    if(me->is_admin) admin_panel();
                    else             trading_dashboard();
                }
                break;
            case 3: printf("  Bye! Happy trading 🚀\n\n"); return 0;
            default: printf("  Invalid.\n");
            
        }
    }
    return 0;
}