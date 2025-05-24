// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CreateContest} from "../src/CreateContest.sol";

contract TestCreateContest is Test {
    CreateContest public createContest;
    

    function setUp() public {
        createContest = new CreateContest();
    }

    function test_CreateContest() public {
        // Create a question array with a single question
        CreateContest.Question[] memory questions = new CreateContest.Question[](1);
        string[] memory options = new string[](4);
        options[0] = "Option A";
        options[1] = "Option B";
        options[2] = "Option C";
        options[3] = "Option D";
        
        questions[0] = CreateContest.Question({
            questionText: "What is the capital of France?",
            options: options,
            correctOptionIndex: 0
        });

        // Create the contest
        createContest.createContest("Geography Quiz", questions);

        // Verify the contest was created correctly
        CreateContest.Contest memory contest = createContest.getContest(0);
        assertEq(contest.contestName, "Geography Quiz");
        assertEq(contest.contestType, "MCQ");
        assertEq(contest.isActive, true);
        assertEq(contest.questions.length, 1);
        assertEq(contest.questions[0].questionText, "What is the capital of France?");
        assertEq(contest.questions[0].options[0], "Option A");
        assertEq(contest.questions[0].options[1], "Option B");
        assertEq(contest.questions[0].correctOptionIndex, 0);
    }

    function test_SubmitAnswers() public {
        // Create a question array with a single question
        CreateContest.Question[] memory questions = new CreateContest.Question[](1);
        string[] memory options = new string[](4);
        options[0] = "Option A";
        options[1] = "Option B";
        options[2] = "Option C";
        options[3] = "Option D";
        
        questions[0] = CreateContest.Question({
            questionText: "What is the capital of France?",
            options: options,
            correctOptionIndex: 1
        });

        // Create the contest
        createContest.createContest("Geography Quiz", questions);

        // Submit answers
        uint256[] memory selectedOptions = new uint256[](1);
        selectedOptions[0] = 1; // Correct answer

        // Test submitting to non-existent contest first
        vm.expectRevert("Invalid contest ID");
        createContest.submitAnswers(1, selectedOptions);

        // Test correct answer submission
        createContest.submitAnswers(0, selectedOptions);
        
        // Verify the score
        assertEq(createContest.getParticipantScore(0, address(this)), 1);
        assertTrue(createContest.hasParticipated(0, address(this)));

        // Test submitting again (should revert with "Already participated")
        vm.expectRevert("Already participated");
        createContest.submitAnswers(0, selectedOptions);

        // Create a new address to test wrong number of answers
        address newParticipant = makeAddr("newParticipant");
        vm.startPrank(newParticipant);
        uint256[] memory wrongLengthAnswers = new uint256[](2);
        vm.expectRevert("Invalid number of answers");
        createContest.submitAnswers(0, wrongLengthAnswers);
        vm.stopPrank();
    }
    
    
}