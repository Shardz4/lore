// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LoreAuditLedger {
    mapping(bytes32 => bool) public verifiedRoots;

    event RootCommitted(bytes32 indexed root, uint256 timestamp);

    function commitRoot(bytes32 root) external {
        require(!verifiedRoots[root], "Root already committed");
        verifiedRoots[root] = true;
        emit RootCommitted(root, block.timestamp);
    }
}
