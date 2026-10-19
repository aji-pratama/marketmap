export const config = {
  runtime: 'edge',
};

let cachedCookie = '';
let cachedCrumb = '';
let lastCrumbTime = 0;

async function getYahooCrumb(): Promise<{ cookie: string; crumb: string }> {
  const now = Date.now();
  if (cachedCrumb && cachedCookie && now - lastCrumbTime < 3600000) {
    return { cookie: cachedCookie, crumb: cachedCrumb };
  }

  try {
    const cookieRes = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    });
    const rawCookies = cookieRes.headers.get('set-cookie') || '';
    const cookieHeader = rawCookies
      .split(',')
      .map((c) => c.split(';')[0])
      .join('; ');

    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        Cookie: cookieHeader,
      },
    });

    if (crumbRes.ok) {
      const crumb = await crumbRes.text();
      if (crumb && !crumb.includes('<html')) {
        cachedCookie = cookieHeader;
        cachedCrumb = crumb.trim();
        lastCrumbTime = now;
        return { cookie: cachedCookie, crumb: cachedCrumb };
      }
    }
  } catch (err) {
    console.error('[Yahoo Proxy] Failed to acquire crumb:', err);
  }

  return { cookie: '', crumb: '' };
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const symbols = url.searchParams.get('symbols') || '';

  if (!symbols) {
    return new Response(JSON.stringify({ error: 'No symbols provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { cookie, crumb } = await getYahooCrumb();
    const targetUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&crumb=${crumb}`;
    
    const yahooRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });

    if (yahooRes.ok) {
      const data = await yahooRes.text();
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Yahoo query failed', status: yahooRes.status }), {
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
