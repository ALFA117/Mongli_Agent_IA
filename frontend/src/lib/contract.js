import { ethers } from "ethers";

const RPC_URL          = import.meta.env.VITE_RPC_URL          || "https://rpc.mantle.xyz";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const API_URL          = import.meta.env.VITE_API_URL          || "";

export const IS_DEMO = !CONTRACT_ADDRESS;

const ABI = [
  "function getRecentSignals(uint256 count) view returns (tuple(uint256 id, address targetWallet, string signalType, uint256 confidenceScore, bytes32 dataHash, uint256 timestamp)[])",
  "function getSignalsByWallet(address wallet) view returns (tuple(uint256 id, address targetWallet, string signalType, uint256 confidenceScore, bytes32 dataHash, uint256 timestamp)[])",
  "function totalSignals() view returns (uint256)",
];

let _provider = null;
let _contract = null;

function getProvider() {
  if (!_provider) _provider = new ethers.JsonRpcProvider(RPC_URL);
  return _provider;
}

function getContract() {
  if (!_contract && CONTRACT_ADDRESS)
    _contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, getProvider());
  return _contract;
}

function normalizeChain(s) {
  return {
    id:         s.id.toString(),
    wallet:     s.targetWallet,
    type:       s.signalType,
    confidence: Number(s.confidenceScore),
    hash:       s.dataHash,
    timestamp:  Number(s.timestamp),
    reasoning:  "",
  };
}

function normalizeApi(s, idx) {
  return {
    id:         String(idx),
    wallet:     s.wallet      || "",
    type:       s.signal_type || s.type || "ANOMALY",
    confidence: Number(s.confidence) || 0,
    hash:       s.on_chain_hash || "0x",
    timestamp:  s.timestamp_unix || Math.floor(Date.now() / 1000) - idx * 300,
    reasoning:  s.reasoning || "",
  };
}

async function apiFetch(path) {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ── Demo mock data — 25 signals over 7 days ────────────────────────── */
const _d = (h) => Math.floor(Date.now() / 1000) - h * 3600;

export const MOCK = [
  // Smart Money In — wallet W1
  { id:"24", wallet:"0xd3aD4c7e8F9b2A1c3E5D7f0B8e2a4C6d8F0B2e4A", type:"SMART_MONEY_IN", confidence:93, hash:"0x90eec545f58d6503f3a1c2d4b5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4", timestamp:_d(0.5), reasoning:"Wallet classified as smart_money. Moved 73,973 MNT across 2 txs. Interacted with 4 DeFi protocol(s). Reached 6 unique counterparties. SmartMoney score: 88/100." },
  { id:"23", wallet:"0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0", type:"WHALE_MOVE",     confidence:81, hash:"0x3f34b065a71b2451150e9d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a", timestamp:_d(1.2), reasoning:"Wallet classified as whale. Moved 120,500 MNT across 3 txs. Interacted with 1 DeFi protocol(s). SmartMoney score: 62/100." },
  { id:"22", wallet:"0xF0e1D2c3B4a5F6e7D8c9B0a1F2e3D4c5B6a7F8e9", type:"SMART_MONEY_IN", confidence:88, hash:"0xc5b1a4c784002b19589d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b", timestamp:_d(2.0), reasoning:"Wallet classified as smart_money. Moved 45,200 MNT across 5 txs. Interacted with 3 DeFi protocol(s). Reached 4 unique counterparties. SmartMoney score: 80/100." },
  { id:"21", wallet:"0x9A8b7C6d5E4f3A2b1C0d9E8f7A6b5C4d3E2f1A0b", type:"ANOMALY",         confidence:74, hash:"0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", timestamp:_d(3.5), reasoning:"Wallet classified as new_wallet. Unusual gas pattern detected. Anomaly score: -0.32. SmartMoney score: 28/100." },
  { id:"20", wallet:"0x2C4e6A8c0E2a4C6e8A0c2E4a6C8e0A2c4E6a8C0e", type:"WHALE_MOVE",     confidence:76, hash:"0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3", timestamp:_d(5.0), reasoning:"Wallet classified as whale. Moved 88,000 MNT in single tx. High volume concentration (0.91). SmartMoney score: 55/100." },
  // Repeating wallets for analytics top-wallets
  { id:"19", wallet:"0xd3aD4c7e8F9b2A1c3E5D7f0B8e2a4C6d8F0B2e4A", type:"SMART_MONEY_IN", confidence:91, hash:"0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5", timestamp:_d(8.0), reasoning:"Second accumulation detected. Pattern consistent with pre-move positioning." },
  { id:"18", wallet:"0xBb1a2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9c", type:"SMART_MONEY_IN", confidence:85, hash:"0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6", timestamp:_d(10.0),reasoning:"Wallet classified as smart_money. 3 DeFi interactions. 52,100 MNT moved." },
  { id:"17", wallet:"0xCc2b3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0d", type:"ANOMALY",         confidence:71, hash:"0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7", timestamp:_d(12.0),reasoning:"Burst of small transactions detected. Bot-like pattern, low SmartMoney score." },
  { id:"16", wallet:"0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0", type:"WHALE_MOVE",     confidence:83, hash:"0xa7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8", timestamp:_d(14.0),reasoning:"Same whale wallet. Large position moved again. 95,000 MNT." },
  { id:"15", wallet:"0xd3aD4c7e8F9b2A1c3E5D7f0B8e2a4C6d8F0B2e4A", type:"SMART_MONEY_IN", confidence:89, hash:"0xb8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9", timestamp:_d(18.0),reasoning:"Third signal for this wallet. Consistent accumulation pattern." },
  { id:"14", wallet:"0xF0e1D2c3B4a5F6e7D8c9B0a1F2e3D4c5B6a7F8e9", type:"WHALE_MOVE",     confidence:77, hash:"0xc9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0", timestamp:_d(22.0),reasoning:"Large outflow detected. 67,800 MNT transferred." },
  { id:"13", wallet:"0xBb1a2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9c", type:"ANOMALY",         confidence:72, hash:"0xd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1", timestamp:_d(28.0),reasoning:"New wallet with unusual first-day activity. High gas pattern." },
  { id:"12", wallet:"0x2C4e6A8c0E2a4C6e8A0c2E4a6C8e0A2c4E6a8C0e", type:"SMART_MONEY_IN", confidence:86, hash:"0xe1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2", timestamp:_d(34.0),reasoning:"Wallet upgraded from whale to smart_money archetype. DeFi interaction surge." },
  { id:"11", wallet:"0x9A8b7C6d5E4f3A2b1C0d9E8f7A6b5C4d3E2f1A0b", type:"SMART_MONEY_IN", confidence:78, hash:"0xf2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3", timestamp:_d(40.0),reasoning:"Previously anomalous wallet now showing smart_money behaviour." },
  { id:"10", wallet:"0xd3aD4c7e8F9b2A1c3E5D7f0B8e2a4C6d8F0B2e4A", type:"WHALE_MOVE",     confidence:79, hash:"0xa3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4", timestamp:_d(48.0),reasoning:"Large liquidity removal from Agni Finance pool." },
  { id:"9",  wallet:"0xCc2b3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0d", type:"SMART_MONEY_IN", confidence:82, hash:"0xb4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5", timestamp:_d(56.0),reasoning:"Unusual accumulation after quiet period. SmartMoney score improved." },
  { id:"8",  wallet:"0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0", type:"ANOMALY",         confidence:73, hash:"0xc5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", timestamp:_d(65.0),reasoning:"Rapid address rotation detected. Possible obfuscation pattern." },
  { id:"7",  wallet:"0xBb1a2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9c", type:"WHALE_MOVE",     confidence:80, hash:"0xd6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7", timestamp:_d(75.0),reasoning:"109,000 MNT moved in coordinated sequence across 4 txs." },
  { id:"6",  wallet:"0xF0e1D2c3B4a5F6e7D8c9B0a1F2e3D4c5B6a7F8e9", type:"SMART_MONEY_IN", confidence:90, hash:"0xe7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", timestamp:_d(90.0),reasoning:"Early accumulation ahead of Merchant Moe liquidity event." },
  { id:"5",  wallet:"0x9A8b7C6d5E4f3A2b1C0d9E8f7A6b5C4d3E2f1A0b", type:"WHALE_MOVE",     confidence:75, hash:"0xf8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9", timestamp:_d(110.0),reasoning:"Liquidity provision to Agni Finance. 78,400 MNT." },
  { id:"4",  wallet:"0x2C4e6A8c0E2a4C6e8A0c2E4a6C8e0A2c4E6a8C0e", type:"ANOMALY",         confidence:70, hash:"0xa9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0", timestamp:_d(132.0),reasoning:"First transaction from new wallet. Immediate high-value move." },
  { id:"3",  wallet:"0xd3aD4c7e8F9b2A1c3E5D7f0B8e2a4C6d8F0B2e4A", type:"SMART_MONEY_IN", confidence:87, hash:"0xb0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1", timestamp:_d(155.0),reasoning:"Fifth signal. Wallet shows consistent long-term accumulation." },
  { id:"2",  wallet:"0xCc2b3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0d", type:"WHALE_MOVE",     confidence:78, hash:"0xc1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2", timestamp:_d(162.0),reasoning:"Large exit from Fluxion AMM pool." },
  { id:"1",  wallet:"0xBb1a2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9c", type:"SMART_MONEY_IN", confidence:84, hash:"0xd2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3", timestamp:_d(168.0),reasoning:"Initial detection. SmartMoney wallet identified, 38,900 MNT accumulated." },
  { id:"0",  wallet:"0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0", type:"SMART_MONEY_IN", confidence:92, hash:"0xe3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4", timestamp:_d(170.0),reasoning:"Genesis signal. Agent first detection run. High-conviction smart money wallet." },
];

/* ── Public API ─────────────────────────────────────────────────────── */

export async function fetchRecentSignals(count = 20) {
  const c = getContract();
  if (c) {
    try {
      const raw = await c.getRecentSignals(count);
      return [...raw].reverse().map(normalizeChain);
    } catch { /* fall through */ }
  }
  const apiData = await apiFetch(`/signals?limit=${count}`);
  if (apiData?.length) return apiData.map(normalizeApi);
  return MOCK.slice(0, count);
}

export async function fetchSignalsByWallet(address) {
  const c = getContract();
  if (c) {
    try {
      const raw = await c.getSignalsByWallet(address);
      return [...raw].reverse().map(normalizeChain);
    } catch { /* fall through */ }
  }
  const apiData = await apiFetch(`/signals/${address}`);
  if (apiData?.length) return apiData.map(normalizeApi);
  // Demo: return mock signals for the searched address
  return MOCK.filter(s => s.wallet.toLowerCase() === address.toLowerCase());
}

export async function fetchTotalSignals() {
  const c = getContract();
  if (c) {
    try { return Number(await c.totalSignals()); } catch { /* fall through */ }
  }
  const stats = await apiFetch("/stats");
  if (stats?.total_signals != null) return stats.total_signals;
  return MOCK.length;
}

export async function fetchLatestSignal() {
  const sigs = await fetchRecentSignals(1);
  return sigs[0] ?? null;
}
