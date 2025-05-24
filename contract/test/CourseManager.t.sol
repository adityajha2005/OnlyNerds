// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CourseManager} from "../src/CourseManager.sol";

contract TestCourseManager is Test {
    CourseManager public courseManager;
    address public buyerAddress;
    address public courseCreator;
    address public buyerAddress2;
    function setUp() public {
        courseManager = new CourseManager();
        buyerAddress = makeAddr("buyer");
        courseCreator = makeAddr("courseCreator");
        buyerAddress2 = makeAddr("buyer2");
        vm.deal(buyerAddress, 1000);
        vm.deal(buyerAddress2, 1000);
    }

    function test_CreateCourse() public {
        vm.startPrank(courseCreator);
        courseManager.createCourse("Test Course", 100, CourseManager.CourseCategory.Web3, CourseManager.CourseLevel.Beginner);
        vm.stopPrank();
        assertEq(courseManager.getCoursesByOwner(courseCreator).length, 1);
    }

    function test_BuyCourse() public {
        vm.startPrank(courseCreator);
        courseManager.createCourse("Test Course", 100, CourseManager.CourseCategory.Web3, CourseManager.CourseLevel.Beginner);
        vm.stopPrank();

        vm.startPrank(buyerAddress);
        courseManager.buyCourse{value: 100}(0, courseCreator);
        vm.stopPrank();

        CourseManager.Course memory course = courseManager.getCourseByCourseId(0, courseCreator);
        
        assertEq(courseManager.getCoursesByOwner(courseCreator).length, 1);
        assertEq(course.courseStudents.length, 1);
        assertEq(course.courseStudents[0], buyerAddress);
        assertEq(course.earnings, 100);
        assertEq(buyerAddress.balance, 900);

        vm.startPrank(courseCreator);
        courseManager.withdrawMoney(0);
        vm.stopPrank();

        assertEq(address(courseCreator).balance, 100);
        assertEq(buyerAddress.balance, 900);
    }

    function test_WithdrawMoney() public {
        vm.startPrank(courseCreator);
        courseManager.createCourse("Test Course", 100, CourseManager.CourseCategory.Web3, CourseManager.CourseLevel.Beginner);
        vm.stopPrank();
        
        vm.startPrank(buyerAddress);
        courseManager.buyCourse{value: 100}(0, courseCreator);
        vm.stopPrank();

        vm.startPrank(buyerAddress2);
        courseManager.buyCourse{value: 100}(0, courseCreator);
        vm.stopPrank();

        CourseManager.Course memory course = courseManager.getCourseByCourseId(0, courseCreator);

        vm.startPrank(courseCreator);
        courseManager.withdrawMoney(0);
        vm.stopPrank();

        assertEq(address(courseCreator).balance, 200);
        assertEq(buyerAddress.balance, 900);
        assertEq(buyerAddress2.balance, 900);
    }

    function test_BanCourse() public {
        vm.startPrank(courseCreator);
        courseManager.createCourse("Test Course", 100, CourseManager.CourseCategory.Web3, CourseManager.CourseLevel.Beginner);
        vm.stopPrank();

        vm.startPrank(address(this));
        courseManager.banCourse(0, courseCreator);
        vm.stopPrank();

        assertEq(courseManager.getCourseByCourseId(0, courseCreator).isCourseActive, false);
    }
}
