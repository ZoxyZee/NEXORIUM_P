import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '../components/ui/sheet';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, WalletCards } from 'lucide-react';

const MARKET_SYMBOLS = [
  { symbol: 'BTCUSDT', label: 'Bitcoin', short: 'BTC' },
  { symbol: 'ETHUSDT', label: 'Ethereum', short: 'ETH' },
  { symbol: 'SOLUSDT', label: 'Solana', short: 'SOL' },
  { symbol: 'BNBUSDT', label: 'BNB', short: 'BNB' },
  { symbol: 'XRPUSDT', label: 'XRP', short: 'XRP' },
  { symbol: 'DOGEUSDT', label: 'Dogecoin', short: 'DOGE' },
  { symbol: 'ADAUSDT', label: 'Cardano', short: 'ADA' },
  { symbol: 'MATICUSDT', label: 'Polygon', short: 'MATIC' },
];

const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  if (numeric >= 1000) return formatter.format(numeric);
  if (numeric >= 1) return numeric.toFixed(2);
  return numeric.toFixed(4);
}

function MarketTile({ coin, index }) {
  const positive = coin.changePct >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -4, scale: 1.015 }}
      className="rounded-lg border border-white/10 bg-white/[0.035] p-4 overflow-hidden relative"
    >
      <div
        className={`absolute inset-x-0 top-0 h-16 opacity-70 ${
          positive
            ? 'bg-gradient-to-br from-emerald-500/20 to-transparent'
            : 'bg-gradient-to-br from-rose-500/18 to-transparent'
        }`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-sm font-semibold text-white">
            {coin.short}
          </div>
          <div>
            <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Outfit' }}>{coin.label}</p>
            <p className="text-xs text-[#94A3B8]">{coin.short}/USDT</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
          {positive ? <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} /> : <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
          {positive ? '+' : ''}{coin.changePct.toFixed(2)}%
        </div>
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
            ${formatPrice(coin.price)}
          </p>
          <p className="text-xs text-[#64748B] mt-1">24h live market</p>
        </div>
        <div className="flex items-end gap-[3px] h-10">
          {[18, 28, 20, 34, 24, 38, 26].map((height, barIndex) => (
            <motion.span
              key={`${coin.symbol}-${barIndex}`}
              initial={{ height: 8 }}
              animate={{ height }}
              transition={{
                repeat: Infinity,
                repeatType: 'reverse',
                duration: 1.4 + barIndex * 0.08,
                delay: barIndex * 0.05,
              }}
              className={`w-1.5 rounded-full ${positive ? 'bg-emerald-300/75' : 'bg-rose-300/75'}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function MarketDrawer({ open, onClose }) {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    const controller = new AbortController();

    const fetchMarkets = async () => {
      setLoading(true);
      try {
        const symbols = encodeURIComponent(JSON.stringify(MARKET_SYMBOLS.map((item) => item.symbol)));
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Market data is temporarily unavailable');
        }
        const data = await response.json();
        if (cancelled) return;

        const normalized = MARKET_SYMBOLS.map((market) => {
          const match = data.find((item) => item.symbol === market.symbol);
          return {
            ...market,
            price: Number(match?.lastPrice || 0),
            changePct: Number(match?.priceChangePercent || 0),
            volume: Number(match?.quoteVolume || 0),
          };
        }).sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

        setCoins(normalized);
        setLastUpdated(new Date());
        setError('');
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load market data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 15000);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [open]);

  const leaders = useMemo(() => coins.slice(0, 3), [coins]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="bg-[#090B14] border-l border-white/5 text-white w-full sm:max-w-xl p-0"
        data-testid="market-drawer"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Live Crypto Market</SheetTitle>
          <SheetDescription>Realtime crypto market data from Binance</SheetDescription>
        </SheetHeader>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="p-8 space-y-8 h-full overflow-y-auto"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#93C5FD] mb-2">Live Market</p>
              <h2 className="text-3xl font-semibold gradient-text" style={{ fontFamily: 'Outfit' }}>
                Crypto Pulse
              </h2>
              <p className="text-sm text-[#94A3B8] mt-2 max-w-md">
                Realtime spot pricing from Binance with 24-hour movement and market momentum.
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-500/12 border border-indigo-300/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-200" strokeWidth={1.5} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leaders.map((coin, index) => (
              <div key={coin.symbol} className="premium-card rounded-lg p-5">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#93C5FD]">{index === 0 ? 'Top Move' : index === 1 ? 'Fast Lane' : 'Watchlist'}</p>
                <p className="text-lg font-semibold text-white mt-3" style={{ fontFamily: 'Outfit' }}>{coin.short}</p>
                <p className="text-sm text-[#94A3B8] mt-1">{coin.label}</p>
                <p className="text-2xl font-semibold text-white mt-4" style={{ fontFamily: 'Outfit' }}>${formatPrice(coin.price)}</p>
                <p className={`text-sm mt-2 font-medium ${coin.changePct >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {coin.changePct >= 0 ? '+' : ''}{coin.changePct.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>

          <div className="premium-card rounded-lg p-5">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#93C5FD]">Trending</p>
                <h3 className="text-xl font-semibold text-white mt-2" style={{ fontFamily: 'Outfit' }}>
                  Market Movers
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#64748B]">Updated</p>
                <p className="text-sm text-[#CBD5E1]">{lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</p>
              </div>
            </div>

            {loading && coins.length === 0 ? (
              <div className="text-sm text-[#94A3B8]">Loading market feed...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {coins.map((coin, index) => (
                  <MarketTile key={coin.symbol} coin={coin} index={index} />
                ))}
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-300" strokeWidth={1.5} />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#93C5FD]">Trend</span>
              </div>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">
                Movers are ranked by the strongest 24h percentage swing across the tracked market set.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 mb-3">
                <WalletCards className="w-4 h-4 text-indigo-200" strokeWidth={1.5} />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#93C5FD]">Source</span>
              </div>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">
                Binance public spot market data refreshed automatically every 15 seconds while this panel is open.
              </p>
            </div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
