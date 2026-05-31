import { ethers } from "ethers";

const RPC_URL          = import.meta.env.VITE_RPC_URL      || "https://rpc.mantle.xyz";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

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

function normalize(s) {
  return {
    id:         s.id.toString(),
    wallet:     s.targetWallet,
    type:       s.signalType,
    confidence: Number(s.confidenceScore),
    hash:       s.dataHash,
    timestamp:  Number(s.timestamp),
  };
}

/* ─── Demo data (shown when CONTRACT_ADDRESS is not set) ─────────── */
const _now = Math.floor(Date.now() / 1000);
const MOCK = [
  { id:"6", wallet:"0xd3aD4c7e8F9b2A1c3E5D7f0B8e2a4C6d8F0B2e4A", type:"SMART_MONEY_IN", confidence:93, hash:"0x", timestamp:_now - 95  },
  { id:"5", wallet:"0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0", type:"WHALE_MOVE",     confidence:81, hash:"0x", timestamp:_now - 480 },
  { id:"4", wallet:"0xF0e1D2c3B4a5F6e7D8c9B0a1F2e3D4c5B6a7F8e9", type:"SMART_MONEY_IN", confidence:88, hash:"0x", timestamp:_now - 900 },
  { id:"3", wallet:"0x9A8b7C6d5E4f3A2b1C0d9E8f7A6b5C4d3E2f1A0b", type:"ANOMALY",         confidence:74, hash:"0x", timestamp:_now - 2100},
  { id:"2", wallet:"0x2C4e6A8c0E2a4C6e8A0c2E4a6C8e0A2c4E6a8C0e", type:"WHALE_MOVE",     confidence:76, hash:"0x", timestamp:_now - 3600},
  { id:"1", wallet:"0xBb1a2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9c", type:"SMART_MONEY_IN", confidence:91, hash:"0x", timestamp:_now - 5400},
  { id:"0", wallet:"0xCc2b3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0d", type:"ANOMALY",         confidence:69, hash:"0x", timestamp:_now - 7200},
];

export async function fetchRecentSignals(count = 20) {
  const c = getContract();
  if (!c) return MOCK.slice(0, count);
  const raw = await c.getRecentSignals(count);
  return [...raw].reverse().map(normalize);
}

export async function fetchSignalsByWallet(address) {
  const c = getContract();
  if (!c) return [];
  const raw = await c.getSignalsByWallet(address);
  return [...raw].reverse().map(normalize);
}

export async function fetchTotalSignals() {
  const c = getContract();
  if (!c) return MOCK.length;
  return Number(await c.totalSignals());
}

export async function fetchLatestSignal() {
  const sigs = await fetchRecentSignals(1);
  return sigs[0] ?? null;
}
