require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources:   "./src",      // MongliSignals.sol lives in src/
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    mantleTestnet: {
      url:      process.env.MANTLE_TESTNET_RPC_URL || "https://rpc.sepolia.mantle.xyz",
      chainId:  5003,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    mantle: {
      url:      process.env.MANTLE_RPC_URL || "https://rpc.mantle.xyz",
      chainId:  5000,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: { mantleTestnet: "no-api-key-needed", mantle: "no-api-key-needed" },
    customChains: [
      {
        network: "mantleTestnet",
        chainId: 5003,
        urls: {
          apiURL:    "https://explorer.sepolia.mantle.xyz/api",
          browserURL:"https://explorer.sepolia.mantle.xyz",
        },
      },
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL:    "https://explorer.mantle.xyz/api",
          browserURL:"https://explorer.mantle.xyz",
        },
      },
    ],
  },
};
