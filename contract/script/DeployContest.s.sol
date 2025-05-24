// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CreateContest} from "../src/CreateContest.sol";

contract DeployContestScript is Script {
    function setUp() public {}

    function hexToUint(string memory str) public pure returns (uint256) {
        bytes memory b = bytes(str);
        uint256 result = 0;
        for (uint256 i = 0; i < b.length; i++) {
            uint256 val = uint256(uint8(b[i]));
            if (val >= 48 && val <= 57) {
                result = result * 16 + (val - 48);
            } else if (val >= 97 && val <= 102) {
                result = result * 16 + (val - 87);
            }
        }
        return result;
    }

    function run() public {
        string memory privateKey = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = hexToUint(privateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        CreateContest contest = new CreateContest();
        console.log("Contest deployed to:", address(contest));

        vm.stopBroadcast();
    }
} 