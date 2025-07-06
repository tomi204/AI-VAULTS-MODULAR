// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../MovementLogger.sol";

contract MockDecisionRegistry is IDecisionRegistry {
    // Storage for CIDs
    mapping(bytes32 => bool) public cids;
    
    // Events
    event CIDPushed(bytes32 indexed cid, uint256 timestamp);
    
    // Push CID function
    function pushCID(bytes32 cid) external override {
        cids[cid] = true;
        emit CIDPushed(cid, block.timestamp);
    }
    
    // Check if CID exists
    function hasCID(bytes32 cid) external view returns (bool) {
        return cids[cid];
    }
} 