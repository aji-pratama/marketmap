import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';

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

function yahooFinanceProxyPlugin(): Plugin {
  return {
    name: 'yahoo-finance-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 1. Bulk Quotes Endpoint: /api/yahoo/quotes?symbols=BBCA.JK,BBRI.JK
        if (req.url.startsWith('/api/yahoo/quotes')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const symbols = urlObj.searchParams.get('symbols') || '';
            const { cookie, crumb } = await getYahooCrumb();

            const targetUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&crumb=${crumb}`;
            const yahooRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                ...(cookie ? { Cookie: cookie } : {}),
              },
            });

            if (yahooRes.ok) {
              const data = await yahooRes.json();
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify(data));
              return;
            } else {
              res.statusCode = yahooRes.status;
              res.end(JSON.stringify({ error: 'Yahoo query failed', status: yahooRes.status }));
              return;
            }
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
            return;
          }
        }

        // 2. Stock Chart Endpoint: /api/yahoo/chart/:symbol?range=1mo&interval=1d
        if (req.url.startsWith('/api/yahoo/chart/')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const symbol = urlObj.pathname.replace('/api/yahoo/chart/', '');
            const range = urlObj.searchParams.get('range') || '1mo';
            const interval = urlObj.searchParams.get('interval') || '1d';

            const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
            const yahooRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
              },
            });

            if (yahooRes.ok) {
              const data = await yahooRes.json();
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify(data));
              return;
            } else {
              res.statusCode = yahooRes.status;
              res.end(JSON.stringify({ error: 'Chart query failed' }));
              return;
            }
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), yahooFinanceProxyPlugin()],
    resolve: {
      alias: {
        '@': import.meta.dirname,
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
