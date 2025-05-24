// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CourseManager} from "../src/CourseManager.sol";

contract CounterScript is Script {
    CourseManager public courseManager;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        courseManager = new CourseManager();

        vm.stopBroadcast();
    }
}
