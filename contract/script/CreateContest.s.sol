// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CreateContest} from "../src/CreateContest.sol";

contract CreateContestScript is Script {
    CreateContest public createContest;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        createContest = new CreateContest();

        vm.stopBroadcast();
    }
    
}

