export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  // Match symbol from path /api/yahoo/chart/:symbol or query param ?symbol=
  const pathname = url.pathname;
  let symbol = url.searchParams.get('symbol') || '';
  if (!symbol) {
    const parts = pathname.split('/');
    symbol = parts[parts.length - 1] || '';
  }

  const range = url.searchParams.get('range') || '1mo';
  const interval = url.searchParams.get('interval') || '1d';

  if (!symbol) {
    return new Response(JSON.stringify({ error: 'No symbol provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const yahooRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (yahooRes.ok) {
      const data = await yahooRes.text();
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Chart query failed', status: yahooRes.status }), {
      status: yahooRes.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
