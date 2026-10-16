-- ==============================================================================
-- Crypto-Apples Database Schema (Standard PostgreSQL for NeonDB)
-- Non-vendor-locked, standard ANSI SQL
-- ==============================================================================

-- 1. Table: Coins (Static Metadata)
CREATE TABLE IF NOT EXISTS coins (
    id VARCHAR(255) PRIMARY KEY,                        -- e.g. 'bitcoin'
    symbol VARCHAR(50) NOT NULL UNIQUE,                 -- e.g. 'BTC'
    name VARCHAR(100) NOT NULL,                         -- e.g. 'Bitcoin'
    category VARCHAR(50) DEFAULT 'Layer 1',             -- e.g. 'Layer 1', 'DeFi', 'AI'
    icon_url TEXT,                                      -- Icon / SVG URL
    binance_symbol VARCHAR(50),                         -- e.g. 'BTCUSDT' (for WebSocket ticks)
    coingecko_id VARCHAR(255),                          -- e.g. 'bitcoin'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: Market Snapshots (Updated by Trigger.dev / Sync Cron)
CREATE TABLE IF NOT EXISTS market_snapshots (
    symbol VARCHAR(20) PRIMARY KEY REFERENCES coins(symbol) ON DELETE CASCADE,
    price_usd NUMERIC(18, 8) NOT NULL,
    market_cap NUMERIC(24, 2),
    market_cap_rank INT,
    total_volume_24h NUMERIC(24, 2),
    high_24h NUMERIC(18, 8),
    low_24h NUMERIC(18, 8),
    change_24h NUMERIC(8, 4),
    change_7d NUMERIC(8, 4),
    sparkline_7d JSONB,                                 -- Array of 7d prices [p1, p2, ...]
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: Promotions & Affiliate Links
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('referral', 'banner', 'swap_widget', 'ad')),
    target_coins TEXT[] DEFAULT '{}',                   -- e.g. ARRAY['BTC', 'SOL'] or empty for global
    cta_text VARCHAR(120) NOT NULL,                     -- e.g. "Trade di Bybit (Diskon Fee 20%)"
    target_url TEXT NOT NULL,                           -- Affiliate / Referral URL
    badge_text VARCHAR(40),                             -- e.g. "Partner Resmi" / "Diskon Fee"
    priority INT DEFAULT 0,                             -- Higher number = higher priority
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_coins_active ON coins(is_active);
CREATE INDEX IF NOT EXISTS idx_market_rank ON market_snapshots(market_cap_rank ASC);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, priority DESC);
