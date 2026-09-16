import React, { useState, useEffect, useCallback, useRef, memo } from "react";

/**
 * Tree Stock: "Buy it. Water it. Watch it grow."
 * A forest where every stock lives with a real tree species. Buy shares and
 * the tree gets watered — leaves sparkle, the canopy pulses — animated,
 * right there in the grove. Wallet connection uses the real injected-
 * provider standard (window.ethereum / window.okxwallet, plus modern
 * EIP-6963 discovery), so it talks to an actual MetaMask / OKX Wallet.
 * Prices, holdings and the growth animations are in-memory app state —
 * a no-backend prototype.
 */

const COLORS = {
  bg: "#CCFF00",
  panel: "#000000",
  panelAlt: "#000000",
  ink: "#000000",
  inkSoft: "rgba(0,0,0,0.65)",
  line: "rgba(204,255,0,0.22)",
  leaf: "#CCFF00",
  leafDark: "#000000",
  sun: "#CCFF00",
  sunDark: "#A3CC00",
  bark: "#6B4A32",
  danger: "#FF6B6B",
  gain: "#7FE0A8",
  white: "#FFFFFF",
  onBlack: "#CCFF00",
  onBlackSoft: "rgba(204,255,0,0.72)",
  onLime: "#000000",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');

@keyframes tsFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes tsFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes tsScaleIn { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
@keyframes tsSway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2.5deg); } }
@keyframes tsSwayStalk { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes tsGrow { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes tsSparkleRise { 0% { opacity: 0; transform: translateY(0) scale(.6) rotate(0deg); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-40px) scale(1.05) rotate(40deg); } }
@keyframes tsFillPulse { 0%,100% { opacity: .85; } 50% { opacity: 1; } }
@keyframes tsMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes tsPulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(63,125,78,0.30); } 50% { box-shadow: 0 0 0 9px rgba(63,125,78,0); } }
@keyframes tsSunDrift { 0%,100% { transform: translate(0,0); } 50% { transform: translate(3%,-2%); } }

html { scroll-behavior: smooth; }

.ts-view-enter { animation: tsFadeUp .5s cubic-bezier(.22,1,.36,1) both; }
.ts-scale-in { animation: tsScaleIn .24s cubic-bezier(.34,1.56,.64,1) both; }
.ts-fade-in { animation: tsFadeIn .2s ease both; }

.ts-btn { transition: transform .26s cubic-bezier(.34,1.56,.64,1), box-shadow .26s ease, opacity .2s ease, background-color .2s ease; }
.ts-btn:hover { transform: translateY(-2px) scale(1.015); box-shadow: 0 10px 24px rgba(43,35,24,0.14); }
.ts-btn:active { transform: translateY(0) scale(0.97); box-shadow: none; }
.ts-btn:disabled { opacity: .5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

.ts-card { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease; }
.ts-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(43,35,24,0.10); }

.ts-link { position: relative; transition: color .2s ease, opacity .2s ease; }
.ts-link:hover { opacity: 0.7; }

.ts-sun { animation: tsSunDrift 10s ease-in-out infinite; }
.ts-sway { animation: tsSway 4.6s ease-in-out infinite; transform-origin: bottom center; }
.ts-sway-stalk { animation: tsSwayStalk 3.4s ease-in-out infinite; transform-origin: bottom center; }

.ts-eating .ts-sway { animation: tsGrow .5s ease-in-out infinite; }
.ts-eating .ts-sway-stalk { animation: tsGrow .45s ease-in-out infinite; }

.ts-sparkle { animation: tsSparkleRise 1.4s ease-out infinite; }
.ts-fill { animation: tsFillPulse 1.6s ease-in-out infinite; }
.ts-marquee-track { animation: tsMarquee 30s linear infinite; }
.ts-glow-pulse { animation: tsPulseGlow 2.4s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .ts-sun, .ts-sway, .ts-sway-stalk, .ts-eating .ts-sway, .ts-eating .ts-sway-stalk,
  .ts-sparkle, .ts-fill, .ts-marquee-track, .ts-glow-pulse {
    animation: none !important;
  }
}
`;

const display = { fontFamily: "'Fraunces', serif" };
const sans = { fontFamily: "'Inter', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

/* ---------- grove + market data ---------- */

const TREES = [
  { id: "bamboo", name: "Bamboo", ticker: "TSLA", domain: "tesla.com", company: "Tesla", grove: "The Bamboo Grove", water: "monsoon rain", base: 252.4, vol: 0.028, canopy: "#5FA85C", canopyDark: "#3C7A3A", trunk: "#7FA83C", accent: "#E8E0A0", variant: "bamboo" },
  { id: "apple", name: "Apple Tree", ticker: "AAPL", domain: "apple.com", company: "Apple", grove: "The Orchard", water: "morning dew", base: 231.1, vol: 0.012, canopy: "#4F8C52", canopyDark: "#356038", trunk: "#6B4A32", accent: "#C0392B", variant: "fruit" },
  { id: "birch", name: "Birch", ticker: "SOFI", domain: "sofi.com", company: "SoFi", grove: "The Birch Stand", water: "spring rain", base: 14.2, vol: 0.035, canopy: "#7FAE6E", canopyDark: "#587F4C", trunk: "#E8E0CE", accent: "#2B2318", variant: "thin" },
  { id: "sequoia", name: "Sequoia", ticker: "NVDA", domain: "nvidia.com", company: "Nvidia", grove: "The Sequoia Ridge", water: "fog drip", base: 136.9, vol: 0.036, canopy: "#2F6E4A", canopyDark: "#1E4B32", trunk: "#7A4A2E", accent: "#4F9D5E", variant: "conical" },
  { id: "kapok", name: "Kapok", ticker: "AMZN", domain: "amazon.com", company: "Amazon", grove: "The Rainforest Canopy", water: "monsoon rain", base: 186.3, vol: 0.020, canopy: "#3F8C4E", canopyDark: "#2A5E36", trunk: "#5E4530", accent: "#E8D96E", variant: "umbrella" },
  { id: "banyan", name: "Banyan", ticker: "PLTR", domain: "palantir.com", company: "Palantir", grove: "The Banyan Court", water: "river silt", base: 178.6, vol: 0.042, canopy: "#4E7D4A", canopyDark: "#365A33", trunk: "#8A6A48", accent: "#6B5233", variant: "layered" },
  { id: "aspen", name: "Aspen", ticker: "RIVN", domain: "rivian.com", company: "Rivian", grove: "The Aspen Grove", water: "root nutrients", base: 13.8, vol: 0.040, canopy: "#C9C85E", canopyDark: "#9E9E3E", trunk: "#D8D2BE", accent: "#3A3A22", variant: "thin" },
  { id: "maple", name: "Japanese Maple", ticker: "AMC", domain: "amctheatres.com", company: "AMC Entertainment", grove: "The Maple Hollow", water: "autumn rain", base: 4.6, vol: 0.070, canopy: "#A8302E", canopyDark: "#7A1F1E", trunk: "#5E4530", accent: "#D9534F", variant: "round" },
  { id: "cherry", name: "Cherry Blossom", ticker: "F", domain: "ford.com", company: "Ford", grove: "The Blossom Garden", water: "spring bloom", base: 11.3, vol: 0.019, canopy: "#F0B8CC", canopyDark: "#D98CA8", trunk: "#5E4530", accent: "#F5E0EA", variant: "fruit" },
  { id: "dragon", name: "Dragon Blood Tree", ticker: "AMD", domain: "amd.com", company: "AMD", grove: "The Dragon's Ridge", water: "desert dew", base: 178.3, vol: 0.034, canopy: "#6E3A2E", canopyDark: "#4A241C", trunk: "#8A5A3A", accent: "#C0392B", variant: "umbrella" },
  { id: "redwood", name: "Redwood", ticker: "COIN", domain: "coinbase.com", company: "Coinbase", grove: "The Redwood Coast", water: "coastal fog", base: 286.4, vol: 0.045, canopy: "#2E5E3E", canopyDark: "#1C3E28", trunk: "#7A4530", accent: "#4F8C5E", variant: "conical" },
  { id: "ginkgo", name: "Ginkgo", ticker: "GME", domain: "gamestop.com", company: "GameStop", grove: "The Temple Grove", water: "temple rain", base: 28.4, vol: 0.062, canopy: "#E8B93D", canopyDark: "#C4941E", trunk: "#6B4A32", accent: "#F5D97A", variant: "fan" },
];

const FULL_AT_USD = 2000; // holding this much (at cost) fully grows the canopy
const CHAIN_NAMES = {
  "0x1": "Ethereum", "0x38": "BNB Chain", "0x89": "Polygon",
  "0xa4b1": "Arbitrum", "0xa": "Optimism", "0x2105": "Base",
};
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const TWITTER_URL = "https://x.com/TreeOnStock";

const FAQ = [
  { q: "What is a stake in a tree, actually?", a: "Each tree in the grove tracks a real, listed stock. Watering that tree buys a tokenized share that follows the underlying stock's price. It's not a share itself, so there's no voting right, no dividend, and no direct legal ownership of the company." },
  { q: "Where do my shares live?", a: "In a vault contract tied to your wallet address, not a Tree Stock account. We never hold your tokens or your keys." },
  { q: "Why does the tree sparkle when I buy?", a: "That's the whole idea. The fuller the canopy, the bigger your position, so you can glance at the grove and read your portfolio without a single number." },
  { q: "Can I sell, or only buy?", a: "This prototype only waters new positions; selling isn't wired up yet. Everything you buy stays in your wallet's vault position regardless." },
  { q: "Are there fees?", a: "No platform fee. You pay only the network's own gas to confirm a purchase." },
  { q: "Is this available everywhere?", a: "Availability of tokenized stocks is restricted in some jurisdictions, including the United States. Nothing on this site is investment advice." },
];

/* ---------- wallet connection (real injected providers) ---------- */

function detectLegacyProviders() {
  const found = [];
  if (typeof window === "undefined") return found;
  const eth = window.ethereum;

  if (eth?.providers?.length) {
    eth.providers.forEach((p) => {
      if (p.isMetaMask) found.push({ id: "metamask", name: "MetaMask", provider: p });
      else if (p.isOkxWallet || p.isOKExWallet) found.push({ id: "okx", name: "OKX Wallet", provider: p });
      else found.push({ id: "injected", name: "Browser wallet", provider: p });
    });
  } else if (eth) {
    if (eth.isMetaMask) found.push({ id: "metamask", name: "MetaMask", provider: eth });
    else if (eth.isOkxWallet || eth.isOKExWallet) found.push({ id: "okx", name: "OKX Wallet", provider: eth });
    else found.push({ id: "injected", name: "Browser wallet", provider: eth });
  }

  if (window.okxwallet && !found.some((f) => f.id === "okx")) {
    found.push({ id: "okx", name: "OKX Wallet", provider: window.okxwallet });
  }

  return found.filter((f, i) => found.findIndex((x) => x.provider === f.provider) === i);
}

function requestEip6963Providers(timeoutMs = 200) {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve([]);
    const found = new Map();
    const onAnnounce = (event) => {
      const { info, provider } = event.detail || {};
      if (!info || !provider) return;
      const id = info.rdns || info.uuid || info.name;
      found.set(id, { id, name: info.name, provider, icon: info.icon });
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      resolve(Array.from(found.values()));
    }, timeoutMs);
  });
}

async function detectProviders() {
  const [modern, legacy] = await Promise.all([requestEip6963Providers(), Promise.resolve(detectLegacyProviders())]);
  const merged = [...modern];
  legacy.forEach((l) => {
    if (!merged.some((m) => m.provider === l.provider)) merged.push(l);
  });
  return merged;
}

function useWallet(toast) {
  const [wallet, setWallet] = useState(null);
  const [picking, setPicking] = useState(false);
  const [pickerOptions, setPickerOptions] = useState([]);
  const [detecting, setDetecting] = useState(false);

  const finishConnect = useCallback(async (option) => {
    try {
      const accounts = await option.provider.request({ method: "eth_requestAccounts" });
      if (!accounts?.length) return;
      const chainId = await option.provider.request({ method: "eth_chainId" });
      setWallet({ address: accounts[0], chainId, providerName: option.name, provider: option.provider });
      setPicking(false);
    } catch (err) {
      toast(err?.code === 4001 ? "Connection request rejected." : "Couldn't connect to that wallet.");
    }
  }, [toast]);

  const connect = useCallback(async () => {
    if (wallet) { setWallet(null); return; }
    setDetecting(true);
    const found = await detectProviders();
    setDetecting(false);
    if (found.length === 0) {
      toast("No wallet extension found. Install MetaMask or OKX Wallet, then reload the page.");
      return;
    }
    if (found.length === 1) finishConnect(found[0]);
    else { setPickerOptions(found); setPicking(true); }
  }, [wallet, finishConnect, toast]);

  useEffect(() => {
    if (!wallet?.provider) return;
    const onAccounts = (accounts) => { if (!accounts?.length) setWallet(null); else setWallet((w) => (w ? { ...w, address: accounts[0] } : w)); };
    const onChain = (chainId) => setWallet((w) => (w ? { ...w, chainId } : w));
    wallet.provider.on?.("accountsChanged", onAccounts);
    wallet.provider.on?.("chainChanged", onChain);
    return () => {
      wallet.provider.removeListener?.("accountsChanged", onAccounts);
      wallet.provider.removeListener?.("chainChanged", onChain);
    };
  }, [wallet?.provider]);

  const cancelPicking = () => setPicking(false);

  return { wallet, connect, picking, pickerOptions, finishConnect, cancelPicking, detecting };
}

function short(addr) { return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ""; }

/* ---------- simulated price ticker ---------- */

function usePrices() {
  const [market, setMarket] = useState(() => {
    const initial = {};
    TREES.forEach((t) => { initial[t.ticker] = { price: t.base, change: 0, open: t.base }; });
    return initial;
  });

  useEffect(() => {
    const jitterInterval = setInterval(() => {
      setMarket((prev) => {
        const next = {};
        TREES.forEach((t) => {
          const cur = prev[t.ticker];
          const drift = (Math.random() - 0.5) * 2 * t.vol;
          const price = Math.max(1, cur.price * (1 + drift * 0.01));
          const change = cur.open ? ((price - cur.open) / cur.open) * 100 : 0;
          next[t.ticker] = { price, open: cur.open, change };
        });
        return next;
      });
    }, 3400);
    return () => clearInterval(jitterInterval);
  }, []);

  const prices = {};
  const changePct = {};
  Object.entries(market).forEach(([ticker, v]) => { prices[ticker] = v.price; changePct[ticker] = v.change; });
  return { prices, changePct };
}

/* ---------- tree illustrations ---------- */
/* Most species share one silhouette (trunk + canopy) with a shape/color
   overlay per variant. Bamboo has its own shape, since stalks don't read
   as "trunk + canopy" at all. When `eating` (watering) is true, the
   `.ts-eating` wrapper class drives the grow-pulse sway. */

function TreeSVG({ cfg, eating, delay = 0 }) {
  const c = cfg;
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <ellipse cx="100" cy="176" rx="50" ry="7" fill="#00000012" />
      <g className={eating ? "" : "ts-sway"} style={eating ? undefined : { animationDelay: `${delay}s` }}>
        {/* trunk */}
        <path d="M92,170 C90,140 90,110 94,90 L106,90 C110,110 110,140 108,170 Z" fill={c.trunk} />

        {/* --- canopy variants --- */}
        {c.variant === "round" && (
          <>
            <circle cx="100" cy="76" r="46" fill={c.canopyDark} />
            <circle cx="78" cy="64" r="34" fill={c.canopy} />
            <circle cx="126" cy="66" r="30" fill={c.canopy} />
            <circle cx="100" cy="52" r="32" fill={c.canopy} />
          </>
        )}
        {c.variant === "fruit" && (
          <>
            <circle cx="100" cy="76" r="46" fill={c.canopyDark} />
            <circle cx="78" cy="64" r="34" fill={c.canopy} />
            <circle cx="126" cy="66" r="30" fill={c.canopy} />
            <circle cx="100" cy="52" r="32" fill={c.canopy} />
            <circle cx="72" cy="70" r="5" fill={c.accent} />
            <circle cx="118" cy="56" r="4.5" fill={c.accent} />
            <circle cx="100" cy="90" r="5" fill={c.accent} />
            <circle cx="132" cy="80" r="4" fill={c.accent} />
          </>
        )}
        {c.variant === "thin" && (
          <>
            <circle cx="80" cy="66" r="20" fill={c.canopy} opacity="0.9" />
            <circle cx="120" cy="60" r="22" fill={c.canopy} opacity="0.9" />
            <circle cx="100" cy="46" r="24" fill={c.canopy} />
            <path d="M96,90 L92,150" stroke={c.accent} strokeWidth="2" opacity="0.35" />
            <path d="M104,90 L108,150" stroke={c.accent} strokeWidth="2" opacity="0.35" />
          </>
        )}
        {c.variant === "conical" && (
          <>
            <path d="M100,20 L136,74 L64,74 Z" fill={c.canopy} />
            <path d="M100,50 L142,104 L58,104 Z" fill={c.canopyDark} />
            <path d="M100,80 L148,138 L52,138 Z" fill={c.canopy} />
          </>
        )}
        {c.variant === "umbrella" && (
          <>
            <ellipse cx="100" cy="66" rx="62" ry="24" fill={c.canopyDark} />
            <ellipse cx="100" cy="58" rx="56" ry="20" fill={c.canopy} />
            {c.id === "dragon" &&
              [...Array(7)].map((_, i) => {
                const x = 56 + i * 13;
                return <line key={i} x1={x} y1="70" x2={x - 6} y2="92" stroke={c.accent} strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />;
              })}
          </>
        )}
        {c.variant === "layered" && (
          <>
            <ellipse cx="100" cy="70" rx="64" ry="26" fill={c.canopyDark} />
            <ellipse cx="100" cy="56" rx="54" ry="22" fill={c.canopy} />
            <ellipse cx="100" cy="44" rx="38" ry="16" fill={c.canopy} />
            <path d="M70,88 L66,130" stroke={c.accent} strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
            <path d="M130,88 L134,128" stroke={c.accent} strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
            <path d="M100,92 L100,124" stroke={c.accent} strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
          </>
        )}
        {c.variant === "fan" && (
          <>
            {[[76, 60], [100, 46], [124, 60], [88, 78], [112, 78], [100, 66]].map(([x, y], i) => (
              <path key={i} d={`M${x},${y} L${x - 12},${y + 16} A14,14 0 0 0 ${x + 12},${y + 16} Z`} fill={i % 2 === 0 ? c.canopy : c.canopyDark} opacity="0.92" />
            ))}
          </>
        )}

        {/* fast sparkles, only visible while watering */}
        {eating && (
          <>
            <circle className="ts-sparkle" cx="78" cy="60" r="3" fill={c.accent} style={{ animationDelay: "0s" }} />
            <circle className="ts-sparkle" cx="120" cy="54" r="2.5" fill={c.accent} style={{ animationDelay: ".3s" }} />
            <circle className="ts-sparkle" cx="100" cy="40" r="3" fill={c.accent} style={{ animationDelay: ".55s" }} />
          </>
        )}
      </g>
    </svg>
  );
}

const Bamboo = memo(function Bamboo({ eating, delay = 0 }) {
  const c = TREES.find((t) => t.id === "bamboo");
  const stalks = [
    { x: 72, h: 150, w: 9 },
    { x: 92, h: 172, w: 11 },
    { x: 112, h: 158, w: 10 },
    { x: 130, h: 138, w: 8 },
  ];
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <ellipse cx="100" cy="178" rx="50" ry="7" fill="#00000012" />
      <g className={eating ? "" : "ts-sway-stalk"} style={eating ? undefined : { animationDelay: `${delay}s` }}>
        {stalks.map((s, i) => {
          const top = 178 - s.h;
          return (
            <g key={i}>
              <rect x={s.x - s.w / 2} y={top} width={s.w} height={s.h} rx={s.w / 2} fill={c.trunk} />
              {[0.25, 0.5, 0.75].map((f, j) => (
                <rect key={j} x={s.x - s.w / 2 - 1} y={top + s.h * f} width={s.w + 2} height="2.5" fill={c.canopyDark} opacity="0.5" />
              ))}
              <ellipse cx={s.x - 10} cy={top + 6} rx="14" ry="7" fill={c.canopy} transform={`rotate(-20 ${s.x - 10} ${top + 6})`} />
              <ellipse cx={s.x + 12} cy={top + 14} rx="13" ry="6" fill={c.canopy} transform={`rotate(18 ${s.x + 12} ${top + 14})`} />
            </g>
          );
        })}
        {eating && (
          <>
            <circle className="ts-sparkle" cx="82" cy="30" r="3" fill={c.accent} style={{ animationDelay: "0s" }} />
            <circle className="ts-sparkle" cx="118" cy="24" r="2.5" fill={c.accent} style={{ animationDelay: ".35s" }} />
          </>
        )}
      </g>
    </svg>
  );
});

function TreeSprite({ tree, eating, delay = 0 }) {
  const wrapClass = `ts-eating-wrap ${eating ? "ts-eating" : ""}`;
  if (tree.id === "bamboo") return <div className={wrapClass} style={{ width: "100%", height: "100%" }}><Bamboo eating={eating} delay={delay} /></div>;
  return <div className={wrapClass} style={{ width: "100%", height: "100%" }}><TreeSVG cfg={tree} eating={eating} delay={delay} /></div>;
}

/* ---------- canopy meter (replaces a trough with a filling canopy) ---------- */

function CanopyMeter({ pct, eating }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ position: "relative", height: 10, borderRadius: 999, background: COLORS.panelAlt, overflow: "hidden", border: `1px solid ${COLORS.line}` }}>
      <div
        className={eating ? "ts-fill" : ""}
        style={{ position: "absolute", inset: 0, width: `${clamped}%`, borderRadius: 999, background: `linear-gradient(90deg, ${COLORS.sun}, ${COLORS.leaf})`, transition: "width .5s cubic-bezier(.22,1,.36,1)" }}
      />
    </div>
  );
}

/* ---------- company logo (with graceful fallback chain) ---------- */

function logoSources(domain) {
  return [
    `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];
}

function CompanyLogo({ tree, size = 22 }) {
  const sources = logoSources(tree.domain);
  const [step, setStep] = useState(0);

  if (step >= sources.length) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0,
          background: tree.canopyDark, color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.42, fontWeight: 700, ...mono,
        }}
      >
        {tree.ticker.slice(0, 1)}
      </div>
    );
  }
  return (
    <img
      key={step}
      src={sources[step]}
      alt={`${tree.company} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setStep((s) => s + 1)}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: "white", objectFit: "contain", padding: size * 0.14,
        border: `1px solid ${COLORS.line}`,
      }}
    />
  );
}

/* ---------- shared bits ---------- */

function Reveal({ children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={shown ? "ts-view-enter" : ""} style={{ opacity: shown ? 1 : 0 }}>{children}</div>;
}

function Sparkles() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="ts-sparkle" style={{ position: "absolute", left: `${30 + i * 20}%`, bottom: "40%", width: 6, height: 6, borderRadius: "50%", background: COLORS.sun, animationDelay: `${i * 0.3}s` }} />
      ))}
    </div>
  );
}

function WalletButton({ walletState }) {
  const { wallet, connect, picking, pickerOptions, finishConnect, cancelPicking, detecting } = walletState;
  return (
    <div style={{ position: "relative" }}>
      <button onClick={connect} disabled={detecting} className="ts-btn" style={{ ...sans, fontWeight: 600, fontSize: 13, padding: "9px 16px", borderRadius: 999, border: `1.5px solid ${COLORS.onLime}`, background: wallet ? COLORS.panel : COLORS.leaf, color: wallet ? COLORS.onBlack : COLORS.onLime, cursor: detecting ? "wait" : "pointer" }}>
        {detecting ? "Looking for wallets…" : wallet ? short(wallet.address) : "Connect wallet"}
      </button>
      {picking && (
        <div className="ts-scale-in" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 8, boxShadow: "0 12px 30px rgba(0,0,0,0.4)", zIndex: 30, minWidth: 180 }}>
          {pickerOptions.map((opt) => (
            <button key={opt.id} onClick={() => finishConnect(opt)} className="ts-btn" style={{ ...sans, display: "block", width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: COLORS.onBlack }}>
              {opt.name}
            </button>
          ))}
          <button onClick={cancelPicking} className="ts-btn" style={{ ...sans, display: "block", width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: COLORS.onBlackSoft }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Nav ---------- */

function XIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18.9 2H22l-7.7 8.8L23.3 22h-6.9l-5.4-7-6.2 7H1.5l8.2-9.4L1 2h7.1l4.9 6.4L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z" fill="currentColor" />
    </svg>
  );
}

function CaBadge() {
  return (
    <span
      className="hidden sm:inline-flex"
      style={{
        ...mono, alignItems: "center", fontSize: 11, fontWeight: 500,
        color: COLORS.onBlackSoft, padding: "6px 10px", borderRadius: 999,
        border: `1px dashed ${COLORS.line}`, background: COLORS.panel,
        whiteSpace: "nowrap",
      }}
    >
      CA: Coming soon
    </span>
  );
}

function Nav({ view, setView, walletState }) {
  const items = [["home", "Home"], ["forest", "Forest"], ["grove", "My grove"], ["faq", "FAQ"]];
  return (
    <nav className="px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 z-20" style={{ background: COLORS.panel, borderBottom: `1px solid ${COLORS.line}` }}>
      <button onClick={() => setView("home")} className="ts-link" style={{ ...display, fontSize: 21, fontWeight: 600, color: COLORS.onBlack, background: "none", border: "none", cursor: "pointer" }}>
        Tree Stock
      </button>
      <div className="hidden md:flex items-center gap-6">
        {items.map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} className="ts-link" style={{ ...sans, fontSize: 14, fontWeight: 600, color: view === id ? COLORS.onBlack : COLORS.onBlackSoft, background: "none", border: "none", cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <CaBadge />
        <a
          href={TWITTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tree Stock on X"
          className="ts-link"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 999, border: `1px solid ${COLORS.line}`, color: COLORS.onBlack, background: COLORS.panel }}
        >
          <XIcon size={15} />
        </a>
        <WalletButton walletState={walletState} />
      </div>
    </nav>
  );
}

/* ---------- ticker tape ---------- */

function TickerTape({ prices, changePct }) {
  const row = TREES.map((t) => (
    <span key={t.ticker} style={{ ...mono, fontSize: 12, color: COLORS.white, padding: "0 18px", whiteSpace: "nowrap" }}>
      {t.ticker} ${prices[t.ticker]?.toFixed(2)}{" "}
      <span style={{ color: changePct[t.ticker] >= 0 ? "#8CE0A8" : "#F3A79C" }}>
        {changePct[t.ticker] >= 0 ? "▲" : "▼"} {Math.abs(changePct[t.ticker] || 0).toFixed(2)}%
      </span>
    </span>
  ));
  return (
    <div style={{ background: COLORS.leafDark, overflow: "hidden", whiteSpace: "nowrap", padding: "7px 0" }}>
      <div className="ts-marquee-track" style={{ display: "inline-block" }}>{row}{row}</div>
    </div>
  );
}

/* ---------- Hero ---------- */

function Hero({ setView }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(320px, 42vw, 520px)",
        backgroundImage: "url('/hero.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: COLORS.bg, // matches hero.png's own background, so no visible letterboxing
      }}
    >
      {/* scrim: fades from the page background color (left, where the text sits)
          toward full image visibility (right), so hero.png can be anything and
          the headline stays readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${COLORS.bg} 0%, ${COLORS.bg}E8 35%, ${COLORS.bg}55 60%, ${COLORS.bg}00 85%)`,
        }}
      />
      <section className="relative px-6 md:px-10 pt-16 pb-14 max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl mb-5" style={{ ...display, color: COLORS.ink, fontWeight: 600, lineHeight: 1.05 }}>
            Buy it. Water it.<br />Watch it grow.
          </h1>
          <p className="text-lg mb-8 max-w-md" style={{ ...sans, color: COLORS.inkSoft, lineHeight: 1.6 }}>
            Every tree in the grove tracks a real stock. Water it and watch your position fill the canopy, no ticker symbols required.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setView("forest")} className="ts-btn ts-glow-pulse" style={{ ...sans, fontWeight: 700, fontSize: 15, padding: "13px 24px", borderRadius: 999, border: `1.5px solid ${COLORS.ink}`, background: COLORS.leaf, color: COLORS.onLime, cursor: "pointer" }}>
              Walk the forest
            </button>
            <button onClick={() => setView("faq")} className="ts-btn" style={{ ...sans, fontWeight: 600, fontSize: 15, padding: "13px 24px", borderRadius: 999, border: `1px solid ${COLORS.leafDark}`, background: "transparent", color: COLORS.leafDark, cursor: "pointer" }}>
              How it works
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- tree card ---------- */

function TreeCard({ tree, price, change, fullness, eating, onWater }) {
  return (
    <div className="ts-card" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative", height: 130, borderRadius: 12, overflow: "hidden", background: `linear-gradient(180deg, #FCF6E3, ${COLORS.panelAlt})` }}>
        <TreeSprite tree={tree} eating={eating} />
        {eating && <Sparkles />}
      </div>
      <div className="flex items-center justify-between">
        <div style={{ ...display, fontWeight: 600, color: COLORS.onBlack, fontSize: 17 }}>{tree.name}</div>
        <div className="flex items-center gap-1.5">
          <CompanyLogo tree={tree} size={18} />
          <div style={{ ...mono, fontSize: 12, color: COLORS.onBlackSoft }}>{tree.ticker}</div>
        </div>
      </div>
      <div className="text-xs" style={{ ...sans, color: COLORS.onBlackSoft }}>{tree.grove} · fed by {tree.water}</div>
      <div className="flex items-center justify-between">
        <div style={{ ...mono, fontSize: 15, color: COLORS.onBlack }}>${price?.toFixed(2)}</div>
        <div style={{ ...mono, fontSize: 12, color: change >= 0 ? COLORS.gain : COLORS.danger }}>
          {change >= 0 ? "+" : ""}{change?.toFixed(2)}%
        </div>
      </div>
      <CanopyMeter pct={fullness} eating={eating} />
      <button onClick={() => onWater(tree.ticker)} className="ts-btn" style={{ ...sans, fontWeight: 600, fontSize: 13, padding: "9px 0", borderRadius: 10, border: "none", background: COLORS.leaf, color: COLORS.onLime, cursor: "pointer" }}>
        Water {tree.name.toLowerCase()}
      </button>
    </div>
  );
}

/* ---------- home preview grid ---------- */

function ForestPreview({ prices, changePct, holdings, eatingId, onWater, setView }) {
  const preview = TREES;
  return (
    <section className="px-6 md:px-10 py-14 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-3xl" style={{ ...display, color: COLORS.ink, fontWeight: 600 }}>A few groves over.</h2>
        <button onClick={() => setView("forest")} className="ts-link" style={{ ...sans, fontWeight: 600, fontSize: 14, color: COLORS.leafDark, background: "none", border: "none", cursor: "pointer" }}>Walk the whole forest →</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {preview.map((tree) => {
          const h = holdings[tree.ticker];
          const fullness = h ? Math.min(100, (h.cost / FULL_AT_USD) * 100) : 0;
          return (
            <TreeCard key={tree.id} tree={tree} price={prices[tree.ticker]} change={changePct[tree.ticker]} fullness={fullness} eating={eatingId === tree.ticker} onWater={onWater} />
          );
        })}
      </div>
    </section>
  );
}

/* ---------- how it works ---------- */

function HowItWorks() {
  const steps = [
    { title: "Pick a grove", body: "Every tree in the forest is paired with one listed stock. Pick the company, not the ticker." },
    { title: "Water it", body: "Buying is watering the roots. Your wallet confirms it, the vault contract holds the tokenized share." },
    { title: "Watch it grow", body: "The tree's canopy tracks your position. No spreadsheet, just a tree that looks well tended." },
  ];
  return (
    <section className="px-6 md:px-10 py-14 max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
      {steps.map((s) => (
        <div key={s.title} style={{ background: COLORS.panelAlt, borderRadius: 18, padding: 22, border: `1px solid ${COLORS.line}` }}>
          <div style={{ ...display, fontSize: 20, fontWeight: 600, color: COLORS.onBlack, marginBottom: 8 }}>{s.title}</div>
          <div style={{ ...sans, fontSize: 14, color: COLORS.onBlackSoft, lineHeight: 1.6 }}>{s.body}</div>
        </div>
      ))}
    </section>
  );
}

/* ---------- safety ---------- */

function Safety({ setView }) {
  return (
    <section className="px-6 md:px-10 py-14 max-w-4xl mx-auto text-center">
      <h2 className="text-3xl mb-4" style={{ ...display, color: COLORS.ink, fontWeight: 600 }}>Your keys, your vault.</h2>
      <p className="text-base mb-6" style={{ ...sans, color: COLORS.inkSoft, lineHeight: 1.7 }}>
        Tree Stock never custodies your funds. Tokenized shares sit in a vault contract tied directly to your wallet address, and only your wallet can move them.
      </p>
      <button onClick={() => setView("faq")} className="ts-link" style={{ ...sans, fontWeight: 600, fontSize: 14, color: COLORS.ink, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Read the FAQ →</button>
    </section>
  );
}

/* ---------- CTA ---------- */

function CTA({ setView }) {
  return (
    <section className="px-6 md:px-10 py-16">
      <div className="max-w-4xl mx-auto text-center" style={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.line}`, borderRadius: 24, padding: "48px 32px" }}>
        <h2 className="text-3xl md:text-4xl mb-4" style={{ ...display, color: COLORS.onBlack, fontWeight: 600 }}>Go plant something.</h2>
        <p className="mb-7" style={{ ...sans, color: COLORS.onBlackSoft, fontSize: 15 }}>Connect a wallet and water your first tree.</p>
        <button onClick={() => setView("forest")} className="ts-btn" style={{ ...sans, fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 999, border: "none", background: COLORS.sun, color: COLORS.onLime, cursor: "pointer" }}>
          Open the forest
        </button>
      </div>
    </section>
  );
}

/* ---------- Forest (full grid) view ---------- */

function ForestView({ prices, changePct, holdings, eatingId, onWater }) {
  return (
    <section className="px-6 md:px-10 py-14 max-w-6xl mx-auto">
      <h2 className="text-4xl mb-8" style={{ ...display, color: COLORS.ink, fontWeight: 600 }}>The forest.</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TREES.map((tree) => {
          const h = holdings[tree.ticker];
          const fullness = h ? Math.min(100, (h.cost / FULL_AT_USD) * 100) : 0;
          return (
            <TreeCard key={tree.id} tree={tree} price={prices[tree.ticker]} change={changePct[tree.ticker]} fullness={fullness} eating={eatingId === tree.ticker} onWater={onWater} />
          );
        })}
      </div>
    </section>
  );
}

/* ---------- custom tree picker (replaces the plain native <select>) ---------- */

function TreeSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = options.find((t) => t.ticker === value);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onEscape = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="ts-btn"
        style={{
          ...sans, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          padding: "10px 12px", borderRadius: 12, border: `1px solid ${COLORS.line}`,
          background: COLORS.panel, color: COLORS.onBlack, fontSize: 14, cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {selected && <CompanyLogo tree={selected} size={24} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected ? `${selected.name} · ${selected.ticker} · ${selected.company}` : "Choose a tree"}
          </span>
        </span>
        <span style={{ color: COLORS.onBlackSoft, fontSize: 11, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease", flexShrink: 0 }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="ts-scale-in"
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 30,
            maxHeight: 320, overflowY: "auto", padding: 6,
            background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 14,
            boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
          }}
        >
          {options.map((t) => {
            const isSelected = t.ticker === value;
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(t.ticker); setOpen(false); }}
                className="ts-btn"
                style={{
                  ...sans, width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 9, border: "none", textAlign: "left", cursor: "pointer",
                  background: isSelected ? COLORS.panelAlt : "transparent", color: COLORS.onBlack, fontSize: 13.5,
                }}
              >
                <CompanyLogo tree={t} size={22} />
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name} · {t.ticker} · {t.company}</span>
                <span style={{ ...sans, fontSize: 11, color: COLORS.onBlackSoft, flexShrink: 0 }}>{t.grove}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Water (buy) view ---------- */

function WaterView({ initialTicker, prices, wallet, connect, waterTree, eatingId }) {
  const [ticker, setTicker] = useState(initialTicker || TREES[0].ticker);
  const [amount, setAmount] = useState(100);
  const [buying, setBuying] = useState(false);
  const tree = TREES.find((t) => t.ticker === ticker);
  const price = prices[ticker];

  const handleBuy = async () => {
    if (!wallet) { connect(); return; }
    setBuying(true);
    await waterTree(ticker, amount);
    setBuying(false);
  };

  return (
    <section className="px-6 md:px-10 py-14 max-w-3xl mx-auto">
      <h2 className="text-4xl mb-8" style={{ ...display, color: COLORS.ink, fontWeight: 600 }}>Water a tree.</h2>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div style={{ position: "relative", height: 220, borderRadius: 18, overflow: "hidden", background: `linear-gradient(180deg, #FCF6E3, ${COLORS.panelAlt})` }}>
          <TreeSprite tree={tree} eating={eatingId === ticker} />
          {eatingId === ticker && <Sparkles />}
        </div>
        <div>
          <label className="block mb-2 text-xs" style={{ ...sans, color: COLORS.inkSoft, fontWeight: 600 }}>Choose a tree</label>
          <div className="mb-5">
            <TreeSelect value={ticker} options={TREES} onChange={setTicker} />
          </div>

          <label className="block mb-2 text-xs" style={{ ...sans, color: COLORS.inkSoft, fontWeight: 600 }}>Amount (USD)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full mb-2" style={{ ...mono, padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.line}`, background: COLORS.panel, color: COLORS.onBlack, fontSize: 14 }} />
          <div className="text-xs mb-5" style={{ ...sans, color: COLORS.inkSoft }}>
            ≈ {price ? (amount / price).toFixed(4) : "—"} shares of {tree.company} at ${price?.toFixed(2)}
          </div>

          <button onClick={handleBuy} disabled={buying} className="ts-btn w-full" style={{ ...sans, fontWeight: 700, fontSize: 15, padding: "13px 0", borderRadius: 12, border: "none", background: COLORS.leaf, color: COLORS.onLime, cursor: buying ? "not-allowed" : "pointer" }}>
            {buying ? "Watering…" : wallet ? `Water ${tree.name.toLowerCase()}` : "Connect wallet to water"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- My Grove (portfolio) view ---------- */

function GroveView({ holdings, prices, setView }) {
  const rows = Object.entries(holdings).map(([ticker, h]) => {
    const tree = TREES.find((t) => t.ticker === ticker);
    const value = h.qty * (prices[ticker] || 0);
    const gain = value - h.cost;
    const fullness = Math.min(100, (h.cost / FULL_AT_USD) * 100);
    return { tree, ticker, ...h, value, gain, fullness };
  });

  return (
    <section className="px-6 md:px-10 py-14 max-w-4xl mx-auto">
      <h2 className="text-4xl mb-8" style={{ ...display, color: COLORS.ink, fontWeight: 600 }}>My grove.</h2>
      {rows.length === 0 ? (
        <div style={{ background: COLORS.panelAlt, borderRadius: 18, padding: 32, textAlign: "center", border: `1px solid ${COLORS.line}` }}>
          <p className="mb-4" style={{ ...sans, color: COLORS.onBlackSoft }}>No trees watered yet. Your grove starts empty.</p>
          <button onClick={() => setView("forest")} className="ts-btn" style={{ ...sans, fontWeight: 600, fontSize: 14, padding: "10px 20px", borderRadius: 999, border: "none", background: COLORS.leaf, color: COLORS.onLime, cursor: "pointer" }}>Go water something</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {rows.map((r) => (
            <div key={r.ticker} className="ts-card" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 16 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: `linear-gradient(180deg, #FCF6E3, ${COLORS.panelAlt})` }}>
                  <TreeSprite tree={r.tree} eating={false} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm" style={{ ...sans, color: COLORS.onBlack, fontWeight: 600 }}>
                      <CompanyLogo tree={r.tree} size={16} />
                      {r.tree.name} · {r.ticker}
                    </div>
                    <div className="text-sm" style={{ ...mono, color: r.gain >= 0 ? COLORS.gain : COLORS.danger }}>{r.gain >= 0 ? "+" : ""}${r.gain.toFixed(2)}</div>
                  </div>
                  <div className="text-xs mb-1.5" style={{ ...sans, color: COLORS.onBlackSoft }}>{r.qty.toFixed(4)} shares · ${r.value.toFixed(2)}</div>
                  <CanopyMeter pct={r.fullness} eating={false} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- FAQ view ---------- */

function FaqView() {
  const [open, setOpen] = useState(0);
  return (
    <section className="px-6 md:px-10 py-16 max-w-2xl mx-auto">
      <h2 className="text-4xl mb-8" style={{ ...display, color: COLORS.ink, fontWeight: 600 }}>Frequently asked.</h2>
      <div className="space-y-3">
        {FAQ.map((item, i) => (
          <div key={item.q} className="ts-card" style={{ borderRadius: 12, overflow: "hidden" }}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full text-left px-5 py-4 flex items-center justify-between" style={{ background: COLORS.panel, border: "none", cursor: "pointer" }}>
              <span className="text-sm" style={{ ...sans, color: COLORS.onBlack, fontWeight: 600 }}>{item.q}</span>
              <span style={{ color: COLORS.leaf, transition: "transform .25s ease", transform: open === i ? "rotate(45deg)" : "rotate(0deg)", display: "inline-block" }}>+</span>
            </button>
            {open === i && (
              <div className="ts-view-enter px-5 py-4 text-sm" style={{ ...sans, color: COLORS.onBlackSoft, lineHeight: 1.6, background: COLORS.panelAlt }}>{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function Footer({ setView }) {
  return (
    <footer className="px-6 md:px-10 py-10 mt-4" style={{ background: COLORS.panelAlt, borderTop: `1px solid ${COLORS.line}` }}>
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div style={{ ...display, color: COLORS.onBlack, fontWeight: 600 }}>Tree Stock</div>
        <div className="flex gap-5 text-sm" style={{ ...sans, color: COLORS.onBlackSoft }}>
          <button onClick={() => setView("faq")} className="ts-link" style={{ background: "none", border: "none", cursor: "pointer" }}>FAQ</button>
          <button onClick={() => setView("forest")} className="ts-link" style={{ background: "none", border: "none", cursor: "pointer" }}>Forest</button>
          <span style={{ ...mono, fontSize: 11 }} title={CONTRACT_ADDRESS}>Vault: {short(CONTRACT_ADDRESS)}</span>
        </div>
      </div>
      <p className="max-w-6xl mx-auto mt-4 text-xs" style={{ ...sans, color: COLORS.onBlackSoft }}>
        Prototype. Tokenized stocks are not shares. Not investment advice. Availability varies by jurisdiction.
      </p>
    </footer>
  );
}

/* ---------- App ---------- */

export default function TreeStockApp() {
  const [view, setView] = useState("home");
  const [holdings, setHoldings] = useState({}); // { TICKER: { qty, cost } }
  const [eatingId, setEatingId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [buyTicker, setBuyTicker] = useState(null);
  const eatingTimer = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3200);
  }, []);

  const { wallet, connect, picking, pickerOptions, finishConnect, cancelPicking, detecting } = useWallet(toast);
  const { prices, changePct } = usePrices();

  const waterTree = useCallback(async (ticker, usd) => {
    const price = prices[ticker];
    await new Promise((res) => setTimeout(res, 1200));
    setHoldings((prev) => {
      const existing = prev[ticker] || { qty: 0, cost: 0 };
      return { ...prev, [ticker]: { qty: existing.qty + usd / price, cost: existing.cost + usd } };
    });
    const tree = TREES.find((t) => t.ticker === ticker);
    clearTimeout(eatingTimer.current);
    setEatingId(ticker);
    eatingTimer.current = setTimeout(() => setEatingId(null), 2400);
    toast(`Watered $${usd} of ${ticker}. The ${tree.name.toLowerCase()} grew a little.`);
  }, [prices, toast]);

  const handleWaterFromCard = useCallback((ticker) => {
    setBuyTicker(ticker);
    setView("buy");
  }, []);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", position: "relative" }}>
      <style>{FONTS}</style>
      <Nav view={view} setView={setView} walletState={{ wallet, connect, picking, pickerOptions, finishConnect, cancelPicking, detecting }} />
      <TickerTape prices={prices} changePct={changePct} />

      <div key={view} className="ts-view-enter">
        {view === "home" && (
          <>
            <Reveal><Hero setView={setView} /></Reveal>
            <TickerTape prices={prices} changePct={changePct} />
            <Reveal>
              <ForestPreview prices={prices} changePct={changePct} holdings={holdings} eatingId={eatingId} onWater={handleWaterFromCard} setView={setView} />
            </Reveal>
            <Reveal><HowItWorks /></Reveal>
            <Reveal><Safety setView={setView} /></Reveal>
            <Reveal><CTA setView={setView} /></Reveal>
          </>
        )}

        {view === "forest" && (
          <ForestView prices={prices} changePct={changePct} holdings={holdings} eatingId={eatingId} onWater={handleWaterFromCard} />
        )}

        {view === "buy" && (
          <WaterView initialTicker={buyTicker} prices={prices} wallet={wallet} connect={connect} waterTree={waterTree} eatingId={eatingId} />
        )}

        {view === "grove" && <GroveView holdings={holdings} prices={prices} setView={setView} />}
        {view === "faq" && <FaqView />}
      </div>

      <Footer setView={setView} />

      {toastMsg && (
        <div className="ts-view-enter fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl text-sm shadow-lg max-w-xs text-center z-40" style={{ ...sans, background: COLORS.panel, border: `1px solid ${COLORS.line}`, color: COLORS.onBlack }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}