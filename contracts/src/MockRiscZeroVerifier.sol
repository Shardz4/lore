// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LoreAuditLedger.sol";

contract MockRiscZeroVerifier is IRiscZeroVerifier {
    bool public shouldFail;
    
    function setShouldFail(bool _shouldFail) external {
        shouldFail = _shouldFail;
    }
    
    function verify(bytes calldata, bytes32, bytes32) external view override {
        if (shouldFail) {
            revert("Mock verification failed");
        }
    }
}
