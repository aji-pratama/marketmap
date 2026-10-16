import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { INITIAL_COINS } from '../../src/data/cryptoData';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

async function runSeed() {
  console.log('🌱 Starting NeonDB Seeding...');

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set in environment or .env file.');
    console.log('👉 Please set DATABASE_URL=postgres://... in your .env file.');
    process.exit(1);
  }

  try {
    const sql = neon(databaseUrl);

    // 1. Seed All 1000 Coins (Ranks 1 to 1000)
    console.log(`⏳ Seeding all ${INITIAL_COINS.length} coins into NeonDB (Ranks 1 to 1000)...`);
    const allCoins = INITIAL_COINS;
    const CHUNK_SIZE = 40;

    for (let i = 0; i < allCoins.length; i += CHUNK_SIZE) {
      const chunk = allCoins.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (coin) => {
          const binanceSymbol = `${coin.symbol.toUpperCase()}USDT`;
          const coingeckoId = coin.id.toLowerCase();

          await sql`
            INSERT INTO coins (id, symbol, name, category, icon_url, binance_symbol, coingecko_id, is_active)
            VALUES (${coin.id}, ${coin.symbol.toUpperCase()}, ${coin.name}, ${coin.category || 'Layer 1'}, ${coin.iconUrl || ''}, ${binanceSymbol}, ${coingeckoId}, true)
            ON CONFLICT (symbol) DO UPDATE SET
              name = EXCLUDED.name,
              category = EXCLUDED.category,
              icon_url = EXCLUDED.icon_url,
              binance_symbol = EXCLUDED.binance_symbol,
              coingecko_id = EXCLUDED.coingecko_id,
              updated_at = NOW();
          `;

          // Seed initial snapshot
          await sql`
            INSERT INTO market_snapshots (
              symbol, price_usd, market_cap, market_cap_rank, total_volume_24h,
              high_24h, low_24h, change_24h, change_7d, updated_at
            ) VALUES (
              ${coin.symbol.toUpperCase()}, ${coin.price || 0}, ${coin.marketCap || 0}, ${coin.rank}, ${coin.volume24h || 0},
              ${(coin.price || 0) * 1.05}, ${(coin.price || 0) * 0.95}, ${coin.changes['24h'] || 0}, ${coin.changes['7d'] || 0}, NOW()
            )
            ON CONFLICT (symbol) DO UPDATE SET
              price_usd = EXCLUDED.price_usd,
              market_cap = EXCLUDED.market_cap,
              market_cap_rank = EXCLUDED.market_cap_rank,
              total_volume_24h = EXCLUDED.total_volume_24h,
              change_24h = EXCLUDED.change_24h,
              change_7d = EXCLUDED.change_7d,
              updated_at = NOW();
          `;
        })
      );
      process.stdout.write(`   ↳ Seeded ${Math.min(i + CHUNK_SIZE, allCoins.length)} / ${allCoins.length} coins...\r`);
    }
    console.log(`\n✅ Successfully seeded all ${allCoins.length} coins & market snapshots (Ranks 1-1000)!`);

    // 2. Seed Initial Affiliate & Promotions
    console.log('⏳ Seeding initial promotions & affiliate links...');
    const initialPromotions = [
      {
        title: 'Bybit Crypto Derivatives',
        type: 'referral',
        target_coins: ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'SUI'],
        cta_text: 'Trading di Bybit (Diskon Fee 20% + Bonus s.d $30,000)',
        target_url: 'https://www.bybit.com/invite?ref=CRYPTOAPPLES',
        badge_text: 'Partner Resmi',
        priority: 100,
      },
      {
        title: 'Binance Exchange',
        type: 'referral',
        target_coins: ['BNB', 'BTC', 'ETH'],
        cta_text: 'Beli Crypto di Binance (Diskon Trading Fee 10%)',
        target_url: 'https://accounts.binance.com/register?ref=CRYPTOAPPLES',
        badge_text: 'Bursa Global #1',
        priority: 90,
      },
      {
        title: 'Tokocrypto / Indodax IDR',
        type: 'referral',
        target_coins: [], // Global / all coins
        cta_text: 'Deposit Rupiah Cepat via QRIS/BCA di Tokocrypto',
        target_url: 'https://www.tokocrypto.com/signup?ref=CRYPTOAPPLES',
        badge_text: 'Lokal Indonesia',
        priority: 80,
      },
      {
        title: 'Ledger Hardware Wallet',
        type: 'banner',
        target_coins: ['BTC', 'ETH', 'SOL'],
        cta_text: 'Amankan Aset Anda dengan Cold Wallet Ledger',
        target_url: 'https://shop.ledger.com/?r=cryptoapples',
        badge_text: 'Self-Custody',
        priority: 70,
      },
    ];

    for (const promo of initialPromotions) {
      await sql`
        INSERT INTO promotions (title, type, target_coins, cta_text, target_url, badge_text, priority, is_active)
        VALUES (${promo.title}, ${promo.type}, ${promo.target_coins}, ${promo.cta_text}, ${promo.target_url}, ${promo.badge_text}, ${promo.priority}, true);
      `;
    }
    console.log(`✅ Seeded ${initialPromotions.length} promotions & affiliate links.`);

    console.log('🎉 Seeding successfully finished!');
  } catch (err: any) {
    console.error('❌ Seeding failed:', err.message || err);
    process.exit(1);
  }
}

runSeed();
