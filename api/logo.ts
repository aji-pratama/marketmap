export const config = {
  runtime: 'edge',
};

// Known popular crypto CoinGecko ID mapping for accurate logo resolution
const CRYPTO_COINGECKO_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  USDC: 'usd-coin',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  TRX: 'tron',
  LINK: 'chainlink',
  MATIC: 'matic-network',
  POL: 'polygon-ecosystem-token',
  NEAR: 'near',
  UNI: 'uniswap',
  LTC: 'litecoin',
  SUI: 'sui',
  APT: 'aptos',
  ATOM: 'cosmos',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
};

function getCandidateUrls(symbol: string, market: string): string[] {
  const sym = symbol.toUpperCase().trim();
  const lower = sym.toLowerCase();

  // If market is explicitly Crypto or detected as Crypto pair
  if (market === 'crypto' || sym.endsWith('USDT') || sym.endsWith('USD') || CRYPTO_COINGECKO_MAP[sym]) {
    const baseSym = sym.replace(/USDT$|USD$/, '');
    const cgId = CRYPTO_COINGECKO_MAP[baseSym] || CRYPTO_COINGECKO_MAP[sym];
    const urls: string[] = [
      `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${(baseSym || lower)}.png`,
      `https://bin.bnbstatic.com/static/images/common/coins/${baseSym || sym}.png`,
    ];
    return urls;
  }

  // If market is US Equity
  if (market === 'us') {
    return [
      `https://financialmodelingprep.com/image-stock/${sym}.png`,
      `https://s.yimg.com/lq/i/c/st/${lower}.png`,
      `https://logo.clearbit.com/${lower}.com`,
    ];
  }

  // Default: IDX Stocks (or cascade fallback)
  return [
    `https://assets.stockbit.com/logos/companies/${sym}.png`,
    `https://financialmodelingprep.com/image-stock/${sym}.png`,
    `https://s.yimg.com/lq/i/c/st/${lower}.png`,
  ];
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol')?.toUpperCase() || '';
  const market = (url.searchParams.get('market') || '').toLowerCase();

  if (!symbol) {
    return new Response(JSON.stringify({ error: 'Missing symbol' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const candidateUrls = getCandidateUrls(symbol, market);

  for (const cdnUrl of candidateUrls) {
    try {
      const res = await fetch(cdnUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Referer': cdnUrl.includes('stockbit') ? 'https://stockbit.com/' : 'https://finance.yahoo.com/',
        },
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/png';
        const buffer = await res.arrayBuffer();
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
          },
        });
      }
    } catch {
      // try next candidate
    }
  }

  return new Response(null, {
    status: 404,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

