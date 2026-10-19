import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  CryptoCoin, Timeframe, SizeByMetric, ContentDisplay, Currency,
  CategoryFilter, ColorMode, PhysicsSettings, ViewMode, ThemeMode
} from './types/crypto';
import { INITIAL_COINS, formatPrice, formatPercent, formatNumber } from './data/cryptoData';
import { sound } from './utils/audio';
import { BubbleSimulation } from './physics/BubbleEngine';
import { Header } from './components/Header';
import { CoinModal } from './components/CoinModal';
import { TableView } from './components/TableView';
import { SettingsModal } from './components/SettingsModal';
import { ScreenshotModal } from './components/ScreenshotModal';
import { NewsTicker } from './components/NewsTicker';
import { BubbleIcon } from './components/BubbleIcon';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  fetchAllMarketCoins,
  fetchMarketCoins,
  enrichWithBinancePrices,
  subscribeToLiveBinanceStream
} from './services/cryptoMarketService';

const DEFAULT_PHYSICS: PhysicsSettings = {
  bubbleCount: 100, // 100 bubbles per page to pack the full screen
  centerAttraction: 0.00005,
  bounceRestitution: 0.8,
  damping: 0.988,
  driftForce: 0.045,
  minRadius: 24,
  maxRadius: 105,
};

export default function App() {
  const [coins, setCoins] = useState<CryptoCoin[]>(() => {
    try {
      const cached = localStorage.getItem('MapSaham_market_cache_v4');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 50) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_COINS; // Always initialize with all 168 IDX stocks!
  });

  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [sizeBy, setSizeBy] = useState<SizeByMetric>('performance');
  const [contentDisplay, setContentDisplay] = useState<ContentDisplay>('performance');
  const [currency, setCurrency] = useState<Currency>('IDR');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('1-100');
  const [colorMode, setColorMode] = useState<ColorMode>('classic');
  const [physics, setPhysics] = useState<PhysicsSettings>(DEFAULT_PHYSICS);
  const [liveSimulation, setLiveSimulation] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('bubbles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [, setLastUpdated] = useState<Date>(new Date());

  // Light / Dark Theme Mode stored in localStorage
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('cb_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const isDark = theme === 'dark';

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('cb_theme', next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleUpdateTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('cb_theme', newTheme);
    } catch {
      // ignore
    }
  };

  // Sync theme class to document <html> element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.style.backgroundColor = '#0b0e14';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.style.backgroundColor = '#f1f5f9';
    }
  }, [theme]);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cb_favorites');
      return saved ? JSON.parse(saved) : ['bitcoin', 'ethereum', 'solana', 'injective'];
    } catch {
      return ['bitcoin', 'ethereum', 'solana', 'injective'];
    }
  });

  // Modal states
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [hoveredCoin, setHoveredCoin] = useState<CryptoCoin | null>(null);
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Canvas & Simulation references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulationRef = useRef<BubbleSimulation | null>(null);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(id);
      const updated = isFav ? prev.filter((f) => f !== id) : [...prev, id];
      try {
        localStorage.setItem('cb_favorites', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };


  // Filter coins according to rank range & favorites.
  // In ALL views (canvas & table): KEEP all coins visible so searched assets are HIGHLIGHTED
  // within their full market context rather than isolating to 1 lonely asset!
  const filteredCoins = useMemo(() => {
    let result = [...coins];

    // Dedicated My Favorites filter
    if (categoryFilter === 'favorites') {
      return result.filter((c) => favorites.includes(c.id));
    }

    if (categoryFilter === '1-1000') {
      return result.slice(0, 1000);
    }

    // Sektoral filters
    const validSectors = [
      'financials',
      'energy',
      'basic-materials',
      'consumer',
      'technology',
      'industrials',
      'properties',
      'healthcare',
      'infrastructure',
    ];

    if (validSectors.includes(categoryFilter)) {
      return result.filter((c) => c.category === categoryFilter);
    }

    // Rank Range filter (100 coins per page up to 1000)
    switch (categoryFilter) {
      case '1-100':
        return result.filter((c) => c.rank >= 1 && c.rank <= 100);
      case '101-200':
        return result.filter((c) => c.rank >= 101 && c.rank <= 200);
      case '201-300':
        return result.filter((c) => c.rank >= 201 && c.rank <= 300);
      case '301-400':
        return result.filter((c) => c.rank >= 301 && c.rank <= 400);
      case '401-500':
        return result.filter((c) => c.rank >= 401 && c.rank <= 500);
      case '501-600':
        return result.filter((c) => c.rank >= 501 && c.rank <= 600);
      case '601-700':
        return result.filter((c) => c.rank >= 601 && c.rank <= 700);
      case '701-800':
        return result.filter((c) => c.rank >= 701 && c.rank <= 800);
      case '801-900':
        return result.filter((c) => c.rank >= 801 && c.rank <= 900);
      case '901-1000':
        return result.filter((c) => c.rank >= 901 && c.rank <= 1000);
      default:
        return result.slice(0, 100);
    }
  }, [coins, categoryFilter, favorites]);

  // Count search matches for display
  const searchMatchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.toLowerCase().trim();
    return filteredCoins.filter((c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).length;
  }, [filteredCoins, searchQuery]);

  // Initialize Canvas simulation
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const sim = new BubbleSimulation(canvas, physics);
    simulationRef.current = sim;

    sim.onSelectCoin = (coin) => {
      setSelectedCoin(coin);
    };

    sim.onHoverCoin = (coin) => {
      setHoveredCoin(coin);
    };

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      sim.resize(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    sim.setCoins(filteredCoins);
    sim.updateConfig(timeframe, sizeBy, contentDisplay, currency, colorMode, physics, favorites, theme, searchQuery);
    if (viewMode === 'bubbles' || viewMode === 'apples') {
      sim.setViewMode(viewMode);
    }
    sim.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      sim.stop();
    };
  }, []);

  const prevCategoryRef = useRef(categoryFilter);
  const prevFavoritesCountRef = useRef(favorites.length);

  // Update simulation when dependencies change smoothly
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;

    const categoryChanged = prevCategoryRef.current !== categoryFilter;
    const favoritesChanged = categoryFilter === 'favorites' && prevFavoritesCountRef.current !== favorites.length;
    prevCategoryRef.current = categoryFilter;
    prevFavoritesCountRef.current = favorites.length;

    if (categoryChanged || favoritesChanged) {
      // Full category / list change: re-sync entities
      sim.setCoins(filteredCoins);
    } else {
      // Live price update: smoothly update numbers without snapping coordinates!
      sim.updateCoinData(filteredCoins);
    }

    sim.updateConfig(timeframe, sizeBy, contentDisplay, currency, colorMode, physics, favorites, theme, searchQuery);
    if (viewMode === 'bubbles' || viewMode === 'apples') {
      sim.setViewMode(viewMode);
    }
  }, [filteredCoins, timeframe, sizeBy, contentDisplay, currency, colorMode, physics, favorites, viewMode, theme, searchQuery, categoryFilter]);

  // Elevate selected coin to top layer in the canvas simulation
  useEffect(() => {
    if (selectedCoin && simulationRef.current) {
      simulationRef.current.bringToFront(selectedCoin.id);
    }
  }, [selectedCoin]);

  useEffect(() => {
    let isMounted = true;
    const loadMarket = async () => {
      setIsRefreshing(true);
      try {
        const allCoins = await fetchAllMarketCoins();
        const enriched = await enrichWithBinancePrices(allCoins);
        if (isMounted && enriched && enriched.length > 0) {
          setCoins(enriched);
          try {
            localStorage.setItem('MapSaham_market_cache_v4', JSON.stringify(enriched));
          } catch {
            // ignore
          }
          setLastUpdated(new Date());
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.error('Failed to load market data:', err);
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    };

    loadMarket();
    const interval = setInterval(loadMarket, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Real-Time Live Streaming Price Feed via Binance Vision WebSocket
  useEffect(() => {
    if (!liveSimulation) return;

    const unsubscribe = subscribeToLiveBinanceStream(
      (updates) => {
        setCoins((prev) => {
          let modified = false;
          const next = prev.map((c) => {
            const sym = c.symbol.toUpperCase();
            const u = updates.get(sym);
            if (!u || !u.price) return c;

            modified = true;
            return {
              ...c,
              price: u.price,
              high24h: u.high24h || c.high24h,
              low24h: u.low24h || c.low24h,
              volume24h: u.volume24h || c.volume24h,
              changes: {
                ...c.changes,
                '1D': u.change24h !== undefined ? Number(u.change24h.toFixed(2)) : (c.changes['1D'] ?? c.changes['24h']),
                '24h': u.change24h !== undefined ? Number(u.change24h.toFixed(2)) : c.changes['24h'],
              },
            };
          });

          if (modified) {
            setLastUpdated(new Date());
            setIsLiveConnected(true);
          }
          return modified ? next : prev;
        });
      },
      (status) => {
        setIsLiveConnected(status === 'connected');
      }
    );

    return () => unsubscribe();
  }, [liveSimulation]);

  // Sync selectedCoin price if detail modal is open
  useEffect(() => {
    if (!selectedCoin) return;
    const fresh = coins.find((c) => c.id === selectedCoin.id || c.symbol.toUpperCase() === selectedCoin.symbol.toUpperCase());
    if (fresh && fresh.price !== selectedCoin.price) {
      setSelectedCoin(fresh);
    }
  }, [coins, selectedCoin]);

  // Manual Refresh Handler
  const handleRefreshMarketData = async () => {
    setIsRefreshing(true);
    sound.playTick();
    try {
      const page = categoryFilter === '101-200' ? 2 : 1;
      const liveCoins = await fetchMarketCoins(page);
      const enriched = await enrichWithBinancePrices(liveCoins);
      if (enriched && enriched.length > 0) {
        setCoins(enriched);
        try {
          localStorage.setItem('cb_market_cache', JSON.stringify(enriched));
        } catch {
          // ignore
        }
        setLastUpdated(new Date());
        setIsLiveConnected(true);
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };


  // Trigger physics reshuffle
  const handleResetPhysics = () => {
    sound.playThrowWhoosh();
    simulationRef.current?.resetPhysics();
  };

  // Capture canvas screenshot
  const handleCaptureScreenshot = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setScreenshotSrc(dataUrl);
    } catch {
      // fallback
    }
  };

  // Global Market stats
  const totalMarketCap = useMemo(() => {
    return coins.reduce((acc, c) => acc + c.marketCap, 0);
  }, [coins]);

  const totalVolume = useMemo(() => {
    return coins.reduce((acc, c) => acc + c.volume24h, 0);
  }, [coins]);

  const topStockDominance = useMemo(() => {
    const bbca = coins.find((c) => c.symbol === 'BBCA');
    if (!bbca || totalMarketCap === 0) return '11.8';
    return ((bbca.marketCap / totalMarketCap) * 100).toFixed(1);
  }, [coins, totalMarketCap]);

  return (
    <div className={`flex flex-col h-[100dvh] w-full max-w-full overflow-hidden select-none transition-colors ${isDark ? 'bg-[#0b0e14] text-slate-100' : 'bg-[#f1f5f9] text-slate-800'
      }`}>
      {/* Top Header Bar */}
      <Header
        timeframe={timeframe}
        sizeBy={sizeBy}
        contentDisplay={contentDisplay}
        currency={currency}
        categoryFilter={categoryFilter}
        viewMode={viewMode}
        searchQuery={searchQuery}
        liveSimulation={liveSimulation}
        favoriteCount={favorites.length}
        theme={theme}
        isLiveConnected={isLiveConnected}
        isRefreshing={isRefreshing}
        onRefreshPrices={handleRefreshMarketData}
        onSelectTimeframe={setTimeframe}
        onSelectSizeBy={setSizeBy}
        onSelectContentDisplay={setContentDisplay}
        onSelectCurrency={setCurrency}
        onSelectCategoryFilter={setCategoryFilter}
        onSelectViewMode={setViewMode}
        onSearchChange={setSearchQuery}

        onToggleLiveSimulation={() => setLiveSimulation((prev) => !prev)}
        onResetPhysics={handleResetPhysics}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onCaptureScreenshot={handleCaptureScreenshot}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Viewport Container */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Semantic SEO & Crawler Layer */}
        <section className="sr-only" aria-label="Saham Indonesia Live Market Heatmap Overview">
          <h1>MapSaham - Visualisasi Interaktif &amp; Heatmap Saham IHSG IDX</h1>
          <p>
            Visualisasi pasar saham Indonesia (IHSG / IDX) interaktif berbasis bubble dan apple physics. Pantau BBCA,
            BBRI, BMRI, TLKM, ASII, BBNI dan saham top bursa efek Indonesia secara real-time / delayed data dari Yahoo Finance.
          </p>
          <h2>Daftar Saham Top Bursa Efek Indonesia</h2>
          <ul>
            {coins.slice(0, 100).map((coin) => (
              <li key={coin.id}>
                <span>#{coin.rank} {coin.name} ({coin.symbol})</span>
                <span>Harga: Rp {coin.price.toLocaleString('id-ID')}</span>
                <span>Perubahan 24j: {coin.changes['24h'] >= 0 ? '+' : ''}{coin.changes['24h']}%</span>
                <span>Market Cap: Rp {(coin.marketCap / 1e12).toFixed(1)}T</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Bubbles / Apples Canvas Simulation View */}
        <div
          className={`absolute inset-0 w-full h-full ${viewMode === 'bubbles' || viewMode === 'apples' ? 'block' : 'hidden'
            }`}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
          />

          {/* Floating Live Hover Capsule */}
          {/* Live Hover Inspection HUD - Mac OS Floating Capsule */}
          {hoveredCoin && (
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${isDark
                ? 'macos-window bg-[#1c1d22]/95 text-slate-100'
                : 'macos-window-light bg-white/95 text-slate-900'
                }`}>
                <BubbleIcon
                  symbol={hoveredCoin.symbol}
                  colorHex={hoveredCoin.colorHex}
                  size={20}
                  className={isDark ? 'bg-black/40 rounded' : 'bg-slate-200/50 rounded'}
                />
                <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                  <span className="font-semibold text-slate-400">
                    #{hoveredCoin.rank}
                  </span>
                  <span className="font-bold">
                    {hoveredCoin.symbol}
                  </span>
                  <span className={isDark ? 'text-white/20' : 'text-slate-300'}>·</span>
                  <span className="font-semibold">
                    {formatPrice(hoveredCoin.price, currency)}
                  </span>
                  <span className={`font-bold ${hoveredCoin.changes[timeframe] >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatPercent(hoveredCoin.changes[timeframe])}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Search Highlight Floating HUD Banner */}
          {searchQuery && (viewMode === 'bubbles' || viewMode === 'apples') && (
            <div className="absolute top-3 right-3 z-20 pointer-events-auto">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${isDark
                ? 'macos-window bg-[#1c1d22]/95 text-slate-100'
                : 'macos-window-light bg-white/95 text-slate-900'
                }`}>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span>
                  {searchMatchCount > 0
                    ? `Highlighted: "${searchQuery}" (${searchMatchCount} match${searchMatchCount > 1 ? 'es' : ''})`
                    : `No matches for "${searchQuery}"`}
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  className={`ml-1 p-0.5 rounded text-xs leading-none ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Empty State for My Favorites or No Matches */}
          {filteredCoins.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 pointer-events-none">
              <div className={`p-6 sm:p-8 rounded-2xl max-w-sm pointer-events-auto shadow-2xl transition-all ${isDark ? 'macos-window bg-[#1c1d22] text-slate-100' : 'macos-window-light bg-white text-slate-900'
                }`}>
                <div className="text-3xl mb-2 select-none">🍎★</div>
                <p className="text-sm font-semibold mb-1">
                  {categoryFilter === 'favorites' ? 'No Favorite Coins Yet' : 'No Assets Found'}
                </p>
                <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {categoryFilter === 'favorites'
                    ? 'Click the star icon ⭐ on any coin card to bookmark it and highlight it in your My Favorites list!'
                    : `No cryptocurrency assets match "${searchQuery}".`}
                </p>
                {categoryFilter === 'favorites' ? (
                  <button
                    onClick={() => {
                      sound.playTick();
                      setCategoryFilter('1-100');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${isDark ? 'macos-btn-dark text-amber-300' : 'macos-btn-light text-amber-800'
                      }`}
                  >
                    Explore Top 100 ➔
                  </button>
                ) : (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isDark ? 'macos-btn-dark text-white' : 'macos-btn-light text-slate-900'
                      }`}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table List View */}
        {viewMode === 'table' && (
          <div className="absolute inset-0 w-full h-full pt-2">
            <TableView
              coins={filteredCoins}
              currency={currency}
              timeframe={timeframe}
              favorites={favorites}
              theme={theme}
              searchQuery={searchQuery}
              onToggleFavorite={handleToggleFavorite}
              onSelectCoin={(coin) => setSelectedCoin(coin)}
            />
          </div>
        )}
      </main>

      {/* Running Breaking News Ticker */}
      <NewsTicker
        theme={theme}
        onSelectCoinTicker={(symbol) => {
          const matched = coins.find((c) => c.symbol.toLowerCase() === symbol.toLowerCase());
          if (matched) {
            setSelectedCoin(matched);
          }
        }}
      />

      {/* Classic Mac OS Bottom Status Bar */}
      <footer className={`w-full px-3 sm:px-5 py-1.5 flex items-center justify-between text-xs font-mono overflow-x-auto select-none z-10 transition-colors shrink-0 tabular-nums mb-14 md:mb-0 ${isDark ? 'macos-titlebar-dark text-slate-400' : 'macos-titlebar-light text-slate-600'
        }`}>
        <div className="flex items-center gap-3 sm:gap-4 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Assets:</span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{filteredCoins.length}</span>
          </div>

          <span className="opacity-30">·</span>

          <div className="flex items-center gap-1.5">
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Market Cap:</span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{formatNumber(totalMarketCap, currency)}</span>
          </div>

          <span className="opacity-30">·</span>

          <div className="flex items-center gap-1.5">
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>24h Vol:</span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{formatNumber(totalVolume, currency)}</span>
          </div>

          <span className="hidden sm:inline opacity-30">·</span>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>BBCA Dom:</span>
            <span className="font-semibold text-emerald-500">{topStockDominance}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4 text-[11px] whitespace-nowrap">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
            Yahoo Finance IDX Delayed / Real-Time Data
          </span>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      {selectedCoin && (
        <CoinModal
          coin={selectedCoin}
          currency={currency}
          isFavorite={favorites.includes(selectedCoin.id)}
          theme={theme}
          timeframe={timeframe}
          onSelectTimeframe={(tf) => setTimeframe(tf)}
          onUpdateCoinChanges={(symbol, newChanges) => {
            setCoins((prev) =>
              prev.map((c) =>
                c.symbol.toUpperCase() === symbol.toUpperCase()
                  ? { ...c, changes: { ...c.changes, ...newChanges } }
                  : c
              )
            );
            setSelectedCoin((prev) =>
              prev && prev.symbol.toUpperCase() === symbol.toUpperCase()
                ? { ...prev, changes: { ...prev.changes, ...newChanges } }
                : prev
            );
          }}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => {
            setSelectedCoin(null);
            setSearchQuery('');
          }}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          physics={physics}
          colorMode={colorMode}
          theme={theme}
          liveSimulation={liveSimulation}
          onUpdatePhysics={setPhysics}
          onUpdateColorMode={setColorMode}
          onUpdateTheme={handleUpdateTheme}
          onToggleLiveSimulation={() => setLiveSimulation((prev) => !prev)}
          onResetDefaults={() => {
            setPhysics(DEFAULT_PHYSICS);
            setColorMode('classic');
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {screenshotSrc && (
        <ScreenshotModal
          imageSrc={screenshotSrc}
          onClose={() => setScreenshotSrc(null)}
        />
      )}

      {/* Classic Mac OS Floating Dock (Mobile Only) */}
      <MobileBottomNav
        viewMode={viewMode}
        timeframe={timeframe}
        categoryFilter={categoryFilter}
        favoriteCount={favorites.length}
        sizeBy={sizeBy}
        currency={currency}
        theme={theme}
        searchQuery={searchQuery}
        isLiveConnected={isLiveConnected}
        onSelectViewMode={setViewMode}
        onSelectTimeframe={setTimeframe}
        onSelectCategoryFilter={setCategoryFilter}
        onSelectSizeBy={setSizeBy}
        onSelectCurrency={setCurrency}
        onSearchChange={setSearchQuery}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
