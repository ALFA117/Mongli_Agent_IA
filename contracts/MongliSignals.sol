// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MongliSignals
 * @notice Records AI-generated on-chain signals from the Mongli_Agent_IA.
 *         Only the designated agent wallet can write signals.
 *         Anyone can read signals — fully auditable.
 */
contract MongliSignals {
    struct Signal {
        uint256 id;
        address targetWallet;
        string signalType;
        uint256 confidenceScore;
        bytes32 dataHash;
        uint256 timestamp;
    }

    address public immutable agent;
    uint256 public totalSignals;

    Signal[] private _signals;
    mapping(address => uint256[]) private _signalsByWallet;

    event SignalRecorded(
        uint256 indexed signalId,
        address indexed targetWallet,
        string signalType,
        uint256 confidenceScore
    );

    modifier onlyAgent() {
        require(msg.sender == agent, "MongliSignals: caller is not the agent");
        _;
    }

    constructor(address _agent) {
        require(_agent != address(0), "MongliSignals: zero address");
        agent = _agent;
    }

    function recordSignal(
        address targetWallet,
        string calldata signalType,
        uint256 confidenceScore,
        bytes32 dataHash
    ) external onlyAgent returns (uint256 signalId) {
        require(confidenceScore <= 100, "MongliSignals: confidence out of range");

        signalId = totalSignals++;
        _signals.push(Signal({
            id: signalId,
            targetWallet: targetWallet,
            signalType: signalType,
            confidenceScore: confidenceScore,
            dataHash: dataHash,
            timestamp: block.timestamp
        }));
        _signalsByWallet[targetWallet].push(signalId);

        emit SignalRecorded(signalId, targetWallet, signalType, confidenceScore);
    }

    function getSignalsByWallet(address wallet) external view returns (Signal[] memory) {
        uint256[] memory ids = _signalsByWallet[wallet];
        Signal[] memory result = new Signal[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _signals[ids[i]];
        }
        return result;
    }

    function getRecentSignals(uint256 count) external view returns (Signal[] memory) {
        uint256 len = _signals.length;
        if (count > len) count = len;
        Signal[] memory result = new Signal[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = _signals[len - count + i];
        }
        return result;
    }

    function getAgentStats() external view returns (uint256 total, uint256 accuracy) {
        total = totalSignals;
        accuracy = 0; // updated via separate accuracy tracking mechanism
    }
}
