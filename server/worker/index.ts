import { neon } from '@neondatabase/serverless';

export interface Env {
  DATABASE_URL?: string;
  ENVIRONMENT?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: any, status = 200, cacheSeconds = 120): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      // Edge Caching: Cloudflare caches for `s-maxage` seconds, browser caches for `max-age` seconds
      'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds * 2}`,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Health check
    if (path === '/api/health') {
      return jsonResponse({
        status: 'ok',
        service: 'crypto-apples-api',
        time: new Date().toISOString(),
        hasDb: Boolean(env.DATABASE_URL),
      });
    }

    // 2. Market Data endpoint (/api/market)
    if (path === '/api/market') {
      if (!env.DATABASE_URL) {
        return jsonResponse(
          { error: 'DATABASE_URL is not configured on Cloudflare Worker' },
          503
        );
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const rows = await sql`
          SELECT 
            m.symbol,
            m.price_usd as price,
            m.market_cap as "marketCap",
            m.market_cap_rank as rank,
            m.total_volume_24h as "volume24h",
            m.high_24h as "high24h",
            m.low_24h as "low24h",
            m.change_24h as "change24h",
            m.change_7d as "change7d",
            m.sparkline_7d as "sparkline7d",
            m.updated_at as "updatedAt",
            c.name,
            c.category,
            c.icon_url as "iconUrl",
            c.binance_symbol as "binanceSymbol"
          FROM market_snapshots m
          LEFT JOIN coins c ON m.symbol = c.symbol
          ORDER BY m.market_cap_rank ASC
          LIMIT 100;
        `;

        return jsonResponse({
          success: true,
          count: rows.length,
          data: rows,
          timestamp: new Date().toISOString(),
        }, 200, 120); // 2 mins cache
      } catch (err: any) {
        return jsonResponse({ error: 'Database query failed', message: err.message }, 500);
      }
    }

    // 3. Promotions & Referral Links (/api/promotions)
    if (path === '/api/promotions') {
      if (!env.DATABASE_URL) {
        return jsonResponse({ success: false, data: [] });
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const rows = await sql`
          SELECT id, title, type, target_coins, cta_text, target_url, badge_text, priority
          FROM promotions
          WHERE is_active = true
          ORDER BY priority DESC;
        `;
        return jsonResponse({ success: true, data: rows }, 200, 300); // 5 mins cache
      } catch (err: any) {
        return jsonResponse({ error: 'Database query failed', message: err.message }, 500);
      }
    }

    // 4. Coins metadata list (/api/coins)
    if (path === '/api/coins') {
      if (!env.DATABASE_URL) {
        return jsonResponse({ success: false, data: [] });
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const rows = await sql`
          SELECT id, symbol, name, category, icon_url, binance_symbol, coingecko_id
          FROM coins
          WHERE is_active = true
          ORDER BY symbol ASC;
        `;
        return jsonResponse({ success: true, data: rows }, 200, 600); // 10 mins cache
      } catch (err: any) {
        return jsonResponse({ error: 'Database query failed', message: err.message }, 500);
      }
    }

    return jsonResponse({ error: 'Not Found', path }, 404);
  },
};
