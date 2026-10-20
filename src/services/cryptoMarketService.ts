import { CryptoCoin, LivePriceUpdate, Timeframe } from '../types/crypto';
import { INITIAL_COINS } from '../data/cryptoData';

export const MARKET_SERVICE_CONFIG = {
  cacheTtlMs: 30000, // 30 seconds cache in memory
  symbolsChunkSize: 50,
};

let cachedMarketCoins: CryptoCoin[] | null = null;
let lastFetchTime = 0;

/**
 * Fetch fresh quote data for IDX stocks (.JK) from Yahoo Finance
export interface IhsgData {
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  prevClose: number;
}

/**
 * Fetch fresh quote data for IDX stocks (.JK) or index tickers (^JKSE) from Yahoo Finance
 * Uses the proxy endpoint /api/yahoo/quotes or local browser session with crumb
 */
export async function fetchYahooQuotes(symbols: string[]): Promise<Map<string, LivePriceUpdate>> {
  const map = new Map<string, LivePriceUpdate>();
  if (!symbols || symbols.length === 0) return map;

  const formattedSymbols = symbols.map((s) => {
    if (s.startsWith('^')) return s;
    return s.endsWith('.JK') ? s : `${s.toUpperCase()}.JK`;
  });

  // Chunk symbols into groups of 50 to avoid URL length issues
  const chunks: string[][] = [];
  for (let i = 0; i < formattedSymbols.length; i += MARKET_SERVICE_CONFIG.symbolsChunkSize) {
    chunks.push(formattedSymbols.slice(i, i + MARKET_SERVICE_CONFIG.symbolsChunkSize));
  }

  for (const chunk of chunks) {
    try {
      const url = `/api/yahoo/quotes?symbols=${encodeURIComponent(chunk.join(','))}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results = data.quoteResponse?.result || data.quotes || [];
        if (Array.isArray(results)) {
          for (const item of results) {
            const sym = (item.symbol || '').toUpperCase();
            const rawSym = sym.replace('.JK', '');
            const price = Number(item.regularMarketPrice) || 0;
            const change = Number(item.regularMarketChangePercent) || 0;
            const high = Number(item.regularMarketDayHigh) || price;
            const low = Number(item.regularMarketDayLow) || price;
            const vol = (Number(item.regularMarketVolume) || 0) * price;

            const updateItem: LivePriceUpdate = {
              symbol: rawSym,
              price,
              change24h: Number(change.toFixed(2)),
              high24h: high,
              low24h: low,
              volume24h: vol,
            };

            map.set(rawSym, updateItem);
            map.set(sym, updateItem);
          }
        }
      }
    } catch {
      // In case /api/yahoo/quotes is not reachable (e.g. static preview), fallback gracefully
    }
  }

  return map;
}

/**
 * Fetch real-time IHSG (Indeks Harga Saham Gabungan - ^JKSE) summary
 */
export async function fetchIhsgSummary(): Promise<IhsgData | null> {
  try {
    const res = await fetch(`/api/yahoo/quotes?symbols=%5EJKSE`);
    if (res.ok) {
      const data = await res.json();
      const item = data.quoteResponse?.result?.[0] || data.quotes?.[0];
      if (item) {
        const price = Number(item.regularMarketPrice) || 0;
        const change = Number(item.regularMarketChange) || 0;
        const changePercent = Number(item.regularMarketChangePercent) || 0;
        return {
          price: Number(price.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          high: Number(item.regularMarketDayHigh) || price,
          low: Number(item.regularMarketDayLow) || price,
          prevClose: Number(item.regularMarketPreviousClose) || price,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to fetch IHSG summary:', e);
  }
  return null;
}

/**
 * Fetches market coins enriched with Yahoo Finance delayed / live quotes.
 */
export async function fetchAllMarketCoins(): Promise<CryptoCoin[]> {
  const now = Date.now();
  if (cachedMarketCoins && now - lastFetchTime < MARKET_SERVICE_CONFIG.cacheTtlMs) {
    return cachedMarketCoins;
  }

  try {
    const symbols = INITIAL_COINS.map((c) => c.symbol);
    const liveMap = await fetchYahooQuotes(symbols);

    if (liveMap.size > 0) {
      const updated = INITIAL_COINS.map((stock) => {
        const live = liveMap.get(stock.symbol.toUpperCase());
        if (!live || !live.price) return stock;

        return {
          ...stock,
          price: live.price,
          high24h: live.high24h || stock.high24h,
          low24h: live.low24h || stock.low24h,
          volume24h: live.volume24h || stock.volume24h,
          changes: {
            ...stock.changes,
            '1D': live.change24h,
            '24h': live.change24h,
          },
        };
      });

      cachedMarketCoins = updated;
      lastFetchTime = now;
      return updated;
    }
  } catch (err) {
    console.warn('Yahoo fetch fallback to INITIAL_COINS:', err);
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
 * Fetch detailed chart data for an individual stock from Yahoo Finance
 */
export async function fetchStockChart(
  symbol: string, 
  range: Timeframe = '1M'
): Promise<number[]> {
  const s = symbol.endsWith('.JK') ? symbol : `${symbol.toUpperCase()}.JK`;
  
  let yahooRange = '1mo';
  let interval = '1d';

  if (range === '1D') {
    yahooRange = '1d';
    interval = '5m';
  } else if (range === '5D') {
    yahooRange = '5d';
    interval = '15m';
  } else if (range === '1M') {
    yahooRange = '1mo';
    interval = '1d';
  } else if (range === '6M') {
    yahooRange = '6mo';
    interval = '1d';
  } else if (range === 'YTD') {
    yahooRange = 'ytd';
    interval = '1d';
  } else if (range === '1Y') {
    yahooRange = '1y';
    interval = '1d';
  } else if (range === '5Y') {
    yahooRange = '5y';
    interval = '1wk';
  } else if (range === 'Max') {
    yahooRange = 'max';
    interval = '1mo';
  }

  try {
    const res = await fetch(`/api/yahoo/chart/${s}?range=${yahooRange}&interval=${interval}`);
    if (res.ok) {
      const data = await res.json();
      const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
      const valid = quotes.filter((p: any) => typeof p === 'number' && !isNaN(p));
      if (valid.length > 0) return valid;
    }
  } catch {
    // fallback
  }

  return [];
}

/**
 * Polling stream for Yahoo Finance (e.g. refresh every 15-30s)
 */
export function subscribeToLiveYahooStream(
  symbols: string[],
  onUpdate: (updates: Map<string, LivePriceUpdate>) => void,
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void,
  intervalMs = 30000
): () => void {
  let isStopped = false;
  let timer: any = null;

  const poll = async () => {
    if (isStopped) return;
    onStatusChange?.('connecting');

    try {
      const quotes = await fetchYahooQuotes(symbols);
      if (quotes.size > 0 && !isStopped) {
        onStatusChange?.('connected');
        onUpdate(quotes);
      } else {
        onStatusChange?.('connected');
      }
    } catch {
      onStatusChange?.('disconnected');
    }

    if (!isStopped) {
      timer = setTimeout(poll, intervalMs);
    }
  };

  poll();

  return () => {
    isStopped = true;
    if (timer) clearTimeout(timer);
  };
}

// Backwards compatibility aliases for existing App imports
export const enrichWithBinancePrices = async (coins: CryptoCoin[]) => coins;
export const subscribeToLiveBinanceStream = (
  onUpdate: (updates: Map<string, LivePriceUpdate>) => void,
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void
) => {
  const symbols = INITIAL_COINS.map((c) => c.symbol);
  return subscribeToLiveYahooStream(symbols, onUpdate, onStatusChange, 30000);
};
