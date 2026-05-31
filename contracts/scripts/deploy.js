const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // The agent wallet that will write signals — can differ from deployer
  const agentAddress = process.env.AGENT_ADDRESS || deployer.address;

  const MongliSignals = await ethers.getContractFactory("MongliSignals");
  const contract = await MongliSignals.deploy(agentAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MongliSignals deployed to:", address);
  console.log("Agent address:", agentAddress);
  console.log("\nAdd to .env:\nCONTRACT_ADDRESS=" + address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
