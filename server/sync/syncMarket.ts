import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export async function syncMarketData() {
  console.log('🔄 [Sync Market] Fetching market coins (Ranks 1 to 1000)...');

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set.');
    return { success: false, error: 'DATABASE_URL is missing' };
  }

  const sql = neon(databaseUrl);

  try {
    let allMarketItems: any[] = [];

    // 1. Try CoinGecko Top 500 (2 pages of 250 coins)
    try {
      for (let p = 1; p <= 2; p++) {
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${p}&sparkline=true&price_change_percentage=24h,7d`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CryptoApples/1.0',
          },
        });
        if (response.ok) {
          const list = await response.json();
          if (Array.isArray(list)) allMarketItems.push(...list);
        } else {
          break;
        }
      }
    } catch {
      // Fallback to CoinPaprika
    }

    // 2. Fallback to CoinPaprika API (1,000 coins in 1 single call)
    if (allMarketItems.length === 0) {
      console.log('⚠️ CoinGecko not responding or limited. Using CoinPaprika fallback (1000 coins)...');
      const paprikaRes = await fetch('https://api.coinpaprika.com/v1/tickers');
      if (paprikaRes.ok) {
        const pList = await paprikaRes.json();
        if (Array.isArray(pList)) {
          allMarketItems = pList.slice(0, 1000).map((c: any) => ({
            id: c.id,
            symbol: c.symbol,
            name: c.name,
            current_price: c.quotes?.USD?.price || 0,
            market_cap: c.quotes?.USD?.market_cap || 0,
            market_cap_rank: c.rank,
            total_volume: c.quotes?.USD?.volume_24h || 0,
            high_24h: (c.quotes?.USD?.price || 0) * 1.05,
            low_24h: (c.quotes?.USD?.price || 0) * 0.95,
            price_change_percentage_24h: c.quotes?.USD?.percent_change_24h || 0,
            price_change_percentage_7d_in_currency: c.quotes?.USD?.percent_change_7d || 0,
            image: '',
            sparkline_in_7d: { price: [] },
          }));
        }
      }
    }

    console.log(`📥 Received ${allMarketItems.length} market items. Updating NeonDB...`);

    let updatedCount = 0;
    const CHUNK_SIZE = 40;

    for (let i = 0; i < allMarketItems.length; i += CHUNK_SIZE) {
      const chunk = allMarketItems.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (item: any) => {
          const symbol = (item.symbol || '').toUpperCase();
          if (!symbol) return;

          const price = Number(item.current_price) || 0;
          const marketCap = Number(item.market_cap) || 0;
          const rank = Number(item.market_cap_rank) || 999;
          const volume = Number(item.total_volume) || 0;
          const high24h = Number(item.high_24h) || price;
          const low24h = Number(item.low_24h) || price;
          const change24h = Number(item.price_change_percentage_24h) || 0;
          const change7d = Number(item.price_change_percentage_7d_in_currency) || 0;
          const sparkline = JSON.stringify(item.sparkline_in_7d?.price || []);

          await sql`
            INSERT INTO coins (id, symbol, name, icon_url, binance_symbol, coingecko_id, is_active)
            VALUES (${item.id}, ${symbol}, ${item.name}, ${item.image || ''}, ${symbol + 'USDT'}, ${item.id}, true)
            ON CONFLICT (symbol) DO UPDATE SET
              name = EXCLUDED.name,
              icon_url = COALESCE(NULLIF(EXCLUDED.icon_url, ''), coins.icon_url),
              updated_at = NOW();
          `;

          await sql`
            INSERT INTO market_snapshots (
              symbol, price_usd, market_cap, market_cap_rank, total_volume_24h,
              high_24h, low_24h, change_24h, change_7d, sparkline_7d, updated_at
            ) VALUES (
              ${symbol}, ${price}, ${marketCap}, ${rank}, ${volume},
              ${high24h}, ${low24h}, ${change24h}, ${change7d}, ${sparkline}, NOW()
            )
            ON CONFLICT (symbol) DO UPDATE SET
              price_usd = EXCLUDED.price_usd,
              market_cap = EXCLUDED.market_cap,
              market_cap_rank = EXCLUDED.market_cap_rank,
              total_volume_24h = EXCLUDED.total_volume_24h,
              high_24h = EXCLUDED.high_24h,
              low_24h = EXCLUDED.low_24h,
              change_24h = EXCLUDED.change_24h,
              change_7d = EXCLUDED.change_7d,
              sparkline_7d = EXCLUDED.sparkline_7d,
              updated_at = NOW();
          `;
          updatedCount++;
        })
      );
      process.stdout.write(`   ↳ Synced ${Math.min(i + CHUNK_SIZE, allMarketItems.length)} / ${allMarketItems.length} items...\r`);
    }

    console.log(`\n✅ Successfully synced ${updatedCount} market items to NeonDB!`);
    return { success: true, count: updatedCount };
  } catch (err: any) {
    console.error('❌ Sync failed:', err.message || err);
    return { success: false, error: err.message };
  }
}

// Allow direct CLI execution: `tsx server/sync/syncMarket.ts`
if (process.argv[1]?.endsWith('syncMarket.ts')) {
  syncMarketData().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
