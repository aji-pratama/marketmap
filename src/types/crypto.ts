export type Timeframe = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'Max';

export type SizeByMetric = 'performance' | 'market_cap' | 'volume';

export type ContentDisplay = 'performance' | 'price' | 'market_cap' | 'rank';

export type Currency = 'IDR' | 'USD' | 'EUR';

export type RankRange = 
  | '1-1000'
  | '1-100' 
  | '101-200' 
  | '201-300' 
  | '301-400' 
  | '401-500' 
  | '501-600' 
  | '601-700' 
  | '701-800' 
  | '801-900' 
  | '901-1000' 
  | 'favorites';

export type SectorFilter = 
  | 'financials' 
  | 'energy' 
  | 'basic-materials' 
  | 'consumer' 
  | 'technology' 
  | 'industrials' 
  | 'properties' 
  | 'healthcare' 
  | 'infrastructure';

export type CategoryFilter = RankRange | SectorFilter;

export type ColorMode = 'classic' | 'colorblind' | 'neon' | 'monochrome';

export type ViewMode = 'bubbles' | 'apples' | 'table';

export type ThemeMode = 'dark' | 'light';

export type MarketType = 'idx' | 'us' | 'crypto';

export type SahamCategory = SectorFilter;

export interface CryptoCoin {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  market?: MarketType;

  price: number; // in IDR base
  changes: Record<string, number>;
  marketCap: number; // in IDR
  volume24h: number; // in IDR
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  totalSupply?: number;
  ath: number;
  athChangePercentage: number;
  sparkline: number[];
  category: SahamCategory | string;
  colorHex?: string;
  iconUrl?: string;
  peRatio?: number;
  pbvRatio?: number;
  dividendYield?: number;
}

export interface LivePriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
}

export interface PhysicsSettings {
  bubbleCount: number;
  centerAttraction: number; // 0.0001 to 0.002
  bounceRestitution: number; // 0.2 to 0.95
  damping: number; // 0.96 to 0.995
  driftForce: number; // 0.01 to 0.15
  minRadius: number; // 24 to 45
  maxRadius: number; // 60 to 140
}

export interface AppSettings {
  timeframe: Timeframe;
  sizeBy: SizeByMetric;
  contentDisplay: ContentDisplay;
  currency: Currency;
  categoryFilter: CategoryFilter;
  colorMode: ColorMode;
  soundEnabled: boolean;
  liveSimulation: boolean;
  physics: PhysicsSettings;
  favorites: string[];
}
