const { ethers, network, run } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Mongli_Agent_IA — MongliSignals deploy");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Network:  ", network.name);
  console.log("  Deployer: ", deployer.address);
  console.log("  Balance:  ", ethers.formatEther(balance), "MNT");

  if (balance === 0n) {
    throw new Error("Deployer wallet has 0 MNT. Fund it first at https://faucet.sepolia.mantle.xyz");
  }

  // Agent wallet that writes signals (defaults to deployer for testing)
  const agentAddress = process.env.AGENT_ADDRESS || deployer.address;
  console.log("  Agent:    ", agentAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n→ Deploying MongliSignals...");
  const Factory  = await ethers.getContractFactory("MongliSignals");
  const contract = await Factory.deploy(agentAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx      = contract.deploymentTransaction();

  console.log("✓ Deployed!");
  console.log("  Contract: ", address);
  console.log("  Tx hash:  ", tx.hash);
  console.log("  Explorer: ", getExplorerUrl(network.name, address));

  // Wait a few blocks before verifying
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n→ Waiting 5 blocks for explorer indexing...");
    await tx.wait(5);

    try {
      console.log("→ Verifying on explorer...");
      await run("verify:verify", {
        address,
        constructorArguments: [agentAddress],
      });
      console.log("✓ Verified on explorer!");
    } catch (e) {
      console.log("⚠ Verification failed (can retry manually):", e.message?.slice(0, 80));
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Add these to your .env:");
  console.log(`  CONTRACT_ADDRESS=${address}`);
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    console.log(`  AGENT_PRIVATE_KEY=${process.env.DEPLOYER_PRIVATE_KEY}  # (or use separate key)`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

function getExplorerUrl(net, addr) {
  if (net === "mantleTestnet") return `https://explorer.sepolia.mantle.xyz/address/${addr}`;
  if (net === "mantle")        return `https://explorer.mantle.xyz/address/${addr}`;
  return addr;
}

main().catch((e) => { console.error(e); process.exit(1); });
