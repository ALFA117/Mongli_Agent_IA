const { expect }     = require("chai");
const { ethers }     = require("hardhat");

describe("MongliSignals", function () {
  let contract, owner, agent, stranger;
  const ZERO_HASH = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, agent, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MongliSignals");
    contract = await Factory.deploy(agent.address);
    await contract.waitForDeployment();
  });

  // ── Deployment ────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the agent address correctly", async function () {
      expect(await contract.agent()).to.equal(agent.address);
    });

    it("starts with zero total signals", async function () {
      expect(await contract.totalSignals()).to.equal(0n);
    });
  });

  // ── recordSignal ──────────────────────────────────────────────────────────

  describe("recordSignal", function () {
    it("agent can record a signal", async function () {
      await expect(
        contract.connect(agent).recordSignal(
          stranger.address, "SMART_MONEY_IN", 87, ZERO_HASH
        )
      ).to.emit(contract, "SignalRecorded")
        .withArgs(0n, stranger.address, "SMART_MONEY_IN", 87n);
    });

    it("non-agent is rejected", async function () {
      await expect(
        contract.connect(stranger).recordSignal(
          stranger.address, "ANOMALY", 75, ZERO_HASH
        )
      ).to.be.revertedWith("MongliSignals: caller is not the agent");
    });

    it("owner (non-agent) is also rejected", async function () {
      await expect(
        contract.connect(owner).recordSignal(
          stranger.address, "WHALE_MOVE", 80, ZERO_HASH
        )
      ).to.be.revertedWith("MongliSignals: caller is not the agent");
    });

    it("rejects confidence > 100", async function () {
      await expect(
        contract.connect(agent).recordSignal(
          stranger.address, "ANOMALY", 101, ZERO_HASH
        )
      ).to.be.revertedWith("MongliSignals: confidence out of range");
    });

    it("accepts confidence of exactly 100", async function () {
      await expect(
        contract.connect(agent).recordSignal(
          stranger.address, "SMART_MONEY_IN", 100, ZERO_HASH
        )
      ).to.not.be.reverted;
    });

    it("accepts confidence of 0", async function () {
      await expect(
        contract.connect(agent).recordSignal(
          stranger.address, "ANOMALY", 0, ZERO_HASH
        )
      ).to.not.be.reverted;
    });

    it("increments totalSignals", async function () {
      await contract.connect(agent).recordSignal(stranger.address, "ANOMALY", 75, ZERO_HASH);
      await contract.connect(agent).recordSignal(stranger.address, "WHALE_MOVE", 82, ZERO_HASH);
      expect(await contract.totalSignals()).to.equal(2n);
    });

    it("returns sequential signalIds starting from 0", async function () {
      const tx1 = await contract.connect(agent).recordSignal(stranger.address, "ANOMALY", 70, ZERO_HASH);
      const receipt1 = await tx1.wait();
      const event1   = receipt1.logs.find(l => l.fragment?.name === "SignalRecorded");
      expect(event1.args.signalId).to.equal(0n);

      const tx2 = await contract.connect(agent).recordSignal(stranger.address, "WHALE_MOVE", 80, ZERO_HASH);
      const receipt2 = await tx2.wait();
      const event2   = receipt2.logs.find(l => l.fragment?.name === "SignalRecorded");
      expect(event2.args.signalId).to.equal(1n);
    });
  });

  // ── getSignalsByWallet ────────────────────────────────────────────────────

  describe("getSignalsByWallet", function () {
    beforeEach(async function () {
      await contract.connect(agent).recordSignal(stranger.address, "SMART_MONEY_IN", 87, ZERO_HASH);
      await contract.connect(agent).recordSignal(stranger.address, "WHALE_MOVE",     78, ZERO_HASH);
      await contract.connect(agent).recordSignal(owner.address,    "ANOMALY",        72, ZERO_HASH);
    });

    it("returns all signals for a specific wallet", async function () {
      const sigs = await contract.getSignalsByWallet(stranger.address);
      expect(sigs.length).to.equal(2);
    });

    it("returns correct signal types", async function () {
      const sigs = await contract.getSignalsByWallet(stranger.address);
      expect(sigs[0].signalType).to.equal("SMART_MONEY_IN");
      expect(sigs[1].signalType).to.equal("WHALE_MOVE");
    });

    it("returns correct confidence scores", async function () {
      const sigs = await contract.getSignalsByWallet(stranger.address);
      expect(sigs[0].confidenceScore).to.equal(87n);
      expect(sigs[1].confidenceScore).to.equal(78n);
    });

    it("returns empty array for wallet with no signals", async function () {
      const sigs = await contract.getSignalsByWallet(agent.address);
      expect(sigs.length).to.equal(0);
    });

    it("only returns signals for the requested wallet", async function () {
      const ownerSigs   = await contract.getSignalsByWallet(owner.address);
      const strangeSigs = await contract.getSignalsByWallet(stranger.address);
      expect(ownerSigs.length).to.equal(1);
      expect(strangeSigs.length).to.equal(2);
    });
  });

  // ── getRecentSignals ──────────────────────────────────────────────────────

  describe("getRecentSignals", function () {
    beforeEach(async function () {
      for (let i = 0; i < 5; i++) {
        await contract.connect(agent).recordSignal(
          stranger.address, "SMART_MONEY_IN", 70 + i, ZERO_HASH
        );
      }
    });

    it("returns the correct count", async function () {
      const sigs = await contract.getRecentSignals(3);
      expect(sigs.length).to.equal(3);
    });

    it("clamps to total when count > total", async function () {
      const sigs = await contract.getRecentSignals(100);
      expect(sigs.length).to.equal(5);
    });

    it("returns 0 signals when count is 0", async function () {
      const sigs = await contract.getRecentSignals(0);
      expect(sigs.length).to.equal(0);
    });

    it("returns signals in insertion order", async function () {
      const sigs = await contract.getRecentSignals(5);
      for (let i = 0; i < 5; i++) {
        expect(sigs[i].confidenceScore).to.equal(BigInt(70 + i));
      }
    });
  });

  // ── getAgentStats ─────────────────────────────────────────────────────────

  describe("getAgentStats", function () {
    it("returns correct total after signals", async function () {
      await contract.connect(agent).recordSignal(stranger.address, "SMART_MONEY_IN", 85, ZERO_HASH);
      await contract.connect(agent).recordSignal(stranger.address, "WHALE_MOVE",     79, ZERO_HASH);
      const [total] = await contract.getAgentStats();
      expect(total).to.equal(2n);
    });
  });

  // ── dataHash storage ──────────────────────────────────────────────────────

  describe("dataHash", function () {
    it("stores and retrieves the data hash correctly", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ test: "data" })));
      await contract.connect(agent).recordSignal(stranger.address, "SMART_MONEY_IN", 88, hash);
      const sigs = await contract.getSignalsByWallet(stranger.address);
      expect(sigs[0].dataHash).to.equal(hash);
    });
  });
});
