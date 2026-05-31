import { ethers } from "ethers";

const RPC_URL = import.meta.env.VITE_RPC_URL || "https://rpc.mantle.xyz";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

const ABI = [
  "function getRecentSignals(uint256 count) view returns (tuple(uint256 id, address targetWallet, string signalType, uint256 confidenceScore, bytes32 dataHash, uint256 timestamp)[])",
  "function getSignalsByWallet(address wallet) view returns (tuple(uint256 id, address targetWallet, string signalType, uint256 confidenceScore, bytes32 dataHash, uint256 timestamp)[])",
  "function totalSignals() view returns (uint256)",
  "function getAgentStats() view returns (uint256 total, uint256 accuracy)",
];

let _provider = null;
let _contract = null;

function getProvider() {
  if (!_provider) _provider = new ethers.JsonRpcProvider(RPC_URL);
  return _provider;
}

export function getContract() {
  if (!_contract && CONTRACT_ADDRESS) {
    _contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, getProvider());
  }
  return _contract;
}

function normalizeSignal(s) {
  return {
    id: s.id.toString(),
    wallet: s.targetWallet,
    type: s.signalType,
    confidence: Number(s.confidenceScore),
    hash: s.dataHash,
    timestamp: Number(s.timestamp),
  };
}

export async function fetchRecentSignals(count = 20) {
  const contract = getContract();
  if (!contract) return MOCK_SIGNALS.slice(0, count);
  const result = await contract.getRecentSignals(count);
  return [...result].reverse().map(normalizeSignal);
}

export async function fetchSignalsByWallet(address) {
  const contract = getContract();
  if (!contract) return [];
  const result = await contract.getSignalsByWallet(address);
  return [...result].reverse().map(normalizeSignal);
}

export async function fetchTotalSignals() {
  const contract = getContract();
  if (!contract) return MOCK_SIGNALS.length;
  const total = await contract.totalSignals();
  return Number(total);
}

/* Demo data shown when CONTRACT_ADDRESS is not set */
const now = Math.floor(Date.now() / 1000);
export const MOCK_SIGNALS = [
  { id: "4", wallet: "0xd3aD4c7e8F9b2A1c3E5D7f0B8e2a4C6d8F0B2e4A", type: "SMART_MONEY_IN", confidence: 91, hash: "0x", timestamp: now - 120 },
  { id: "3", wallet: "0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0", type: "WHALE_MOVE", confidence: 78, hash: "0x", timestamp: now - 600 },
  { id: "2", wallet: "0xF0e1D2c3B4a5F6e7D8c9B0a1F2e3D4c5B6a7F8e9", type: "ANOMALY", confidence: 74, hash: "0x", timestamp: now - 1800 },
  { id: "1", wallet: "0x9A8b7C6d5E4f3A2b1C0d9E8f7A6b5C4d3E2f1A0b", type: "SMART_MONEY_IN", confidence: 85, hash: "0x", timestamp: now - 3600 },
  { id: "0", wallet: "0x2C4e6A8c0E2a4C6e8A0c2E4a6C8e0A2c4E6a8C0e", type: "WHALE_MOVE", confidence: 69, hash: "0x", timestamp: now - 7200 },
];
