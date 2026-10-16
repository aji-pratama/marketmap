import { CryptoCoin, LivePriceUpdate } from '../types/crypto';
import { INITIAL_COINS } from '../data/cryptoData';

export const MARKET_SERVICE_CONFIG = {
  coinPaprikaBaseUrl: 'https://api.coinpaprika.com/v1',
  binanceRestUrl: 'https://data-api.binance.vision/api/v3',
  binanceWsUrl: 'wss://data-stream.binance.vision/ws/!ticker@arr',
  cacheTtlMs: 45000, // 45 seconds cache in memory
};

let cachedMarketCoins: CryptoCoin[] | null = null;
let lastFetchTime = 0;

/**
 * 100% Free Client-Side Market Fetcher (0 Server / 0 Database Cost)
 * Fetches 1,000 live coins directly from CoinPaprika's free public tickers API,
 * then enriches with Binance Vision live WebSocket/REST tickers.
 */
export async function fetchAllMarketCoins(): Promise<CryptoCoin[]> {
  const now = Date.now();
  if (cachedMarketCoins && now - lastFetchTime < MARKET_SERVICE_CONFIG.cacheTtlMs) {
    return cachedMarketCoins;
  }

  try {
    const res = await fetch(`${MARKET_SERVICE_CONFIG.coinPaprikaBaseUrl}/tickers`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length >= 100) {
        const top1000 = data.slice(0, 1000);
        const mappedCoins: CryptoCoin[] = top1000.map((item: any, idx: number) => {
          const symbol = (item.symbol || '').toUpperCase();
          const quotes = item.quotes?.USD || {};
          const price = Number(quotes.price) || 0;
          const rank = item.rank || idx + 1;
          const c1h = Number(quotes.percent_change_1h) || 0;
          const c24h = Number(quotes.percent_change_24h) || 0;
          const c7d = Number(quotes.percent_change_7d) || 0;
          const c30d = Number(quotes.percent_change_30d) || 0;
          const c1y = Number(quotes.percent_change_1y) || 0;

          // Realistic price trend sparkline
          const sparkline: number[] = [];
          const startP = price / (1 + (c7d || c24h) / 100);
          for (let i = 0; i < 24; i++) {
            const prog = i / 23;
            sparkline.push(startP + (price - startP) * prog);
          }

          let category: CryptoCoin['category'] = 'layer1';
          const s = symbol.toLowerCase();
          if (['uni', 'aave', 'mkr', 'crv', 'snx', 'ldo', 'pendle'].includes(s)) category = 'defi';
          else if (['doge', 'shib', 'pepe', 'bonk', 'floki', 'wif', 'bome', 'popcat'].includes(s)) category = 'meme';
          else if (['fet', 'rndr', 'render', 'tao', 'near', 'akt', 'ocean'].includes(s)) category = 'ai';
          else if (['link', 'pyth', 'grt', 'tia', 'fil', 'ar'].includes(s)) category = 'infra';
          else if (['arb', 'op', 'matic', 'pol', 'strk', 'blast', 'manta'].includes(s)) category = 'l2';

          return {
            id: item.id || symbol.toLowerCase(),
            name: item.name || symbol,
            symbol,
            rank,
            price,
            changes: {
              '1h': c1h,
              '24h': c24h,
              '7d': c7d,
              '30d': c30d,
              '1y': c1y,
            },
            marketCap: Number(quotes.market_cap) || 0,
            volume24h: Number(quotes.volume_24h) || 0,
            high24h: price * 1.05,
            low24h: price * 0.95,
            circulatingSupply: Number(item.total_supply) || 0,
            totalSupply: Number(item.max_supply) || undefined,
            ath: Number(quotes.ath_price) || price,
            athChangePercentage: Number(quotes.percent_from_price_ath) || 0,
            sparkline,
            category,
            colorHex: '#3B82F6',
          };
        });

        cachedMarketCoins = mappedCoins;
        lastFetchTime = now;
        return mappedCoins;
      }
    }
  } catch (err) {
    console.warn('Direct Paprika fetch fallback to INITIAL_COINS:', err);
  }

  cachedMarketCoins = INITIAL_COINS;
  lastFetchTime = now;
  return INITIAL_COINS;
}

export async function fetchMarketCoins(page = 1): Promise<CryptoCoin[]> {
  const all = await fetchAllMarketCoins();
  const offset = (page - 1) * 100;
  return all.slice(offset, offset + 100);
}

/**
 * Fetch real-time 24hr tickers from Binance REST API (unblocked Vision mirror)
 */
export async function fetchBinancePrices(): Promise<Map<string, LivePriceUpdate>> {
  const map = new Map<string, LivePriceUpdate>();
  try {
    const res = await fetch(`${MARKET_SERVICE_CONFIG.binanceRestUrl}/ticker/24hr`);
    if (!res.ok) return map;

    const data = await res.json();
    if (!Array.isArray(data)) return map;

    for (const item of data) {
      const sym = item.symbol;
      if (sym.endsWith('USDT')) {
        const baseSymbol = sym.slice(0, -4).toUpperCase();
        map.set(baseSymbol, {
          symbol: baseSymbol,
          price: Number(item.lastPrice) || 0,
          change24h: Number(item.priceChangePercent) || 0,
          high24h: Number(item.highPrice) || 0,
          low24h: Number(item.lowPrice) || 0,
          volume24h: Number(item.quoteVolume) || 0,
        });
      }
    }
  } catch {
    // fallback
  }
  return map;
}

/**
 * Enrich 1,000 coins with real-time Binance prices
 */
export async function enrichWithBinancePrices(coins: CryptoCoin[]): Promise<CryptoCoin[]> {
  const binancePrices = await fetchBinancePrices();
  if (binancePrices.size === 0) return coins;

  return coins.map((coin) => {
    const live = binancePrices.get(coin.symbol.toUpperCase());
    if (!live || !live.price) return coin;

    return {
      ...coin,
      price: live.price,
      high24h: live.high24h || coin.high24h,
      low24h: live.low24h || coin.low24h,
      volume24h: live.volume24h || coin.volume24h,
      changes: {
        ...coin.changes,
        '24h': live.change24h !== undefined ? Number(live.change24h.toFixed(2)) : coin.changes['24h'],
      },
    };
  });
}

/**
 * Subscribe to Binance Vision live WebSocket ticker stream
 */
export function subscribeToLiveBinanceStream(
  onUpdate: (updates: Map<string, LivePriceUpdate>) => void,
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void
): () => void {
  let ws: WebSocket | null = null;
  let isClosed = false;
  let reconnectTimeout: any = null;

  const connect = () => {
    if (isClosed) return;
    onStatusChange?.('connecting');

    try {
      ws = new WebSocket(MARKET_SERVICE_CONFIG.binanceWsUrl);

      ws.onopen = () => {
        onStatusChange?.('connected');
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (!Array.isArray(raw)) return;

          const batch = new Map<string, LivePriceUpdate>();
          for (const item of raw) {
            const sym = item.s;
            if (typeof sym === 'string' && sym.endsWith('USDT')) {
              const base = sym.slice(0, -4).toUpperCase();
              batch.set(base, {
                symbol: base,
                price: Number(item.c) || 0,
                change24h: Number(item.P) || 0,
                high24h: Number(item.h) || 0,
                low24h: Number(item.l) || 0,
                volume24h: Number(item.q) || 0,
              });
            }
          }

          if (batch.size > 0) {
            onUpdate(batch);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        onStatusChange?.('disconnected');
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    } catch {
      onStatusChange?.('disconnected');
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
  };
}
