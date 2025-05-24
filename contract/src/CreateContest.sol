// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract CreateContest {
    struct Question {
        string questionText;
        string[] options;
        uint256 correctOptionIndex;
    }

    struct Contest {
        string contestName;
        string contestType;
        Question[] questions;
        bool isActive;
    }

    Contest[] public contests;
    mapping(uint256 => mapping(address => bool)) public hasParticipated;
    mapping(uint256 => mapping(address => uint256)) public participantScores;

    event ContestCreated(uint256 indexed contestId, string contestName);
    event ContestSubmitted(uint256 indexed contestId, address indexed participant, uint256 score);

    function createContest(
        string memory _contestName,
        Question[] memory _questions
    ) public {
        require(_questions.length > 0, "Contest must have at least one question");

        Contest memory newContest = Contest({
            contestName: _contestName,
            contestType: "MCQ",
            questions: _questions,
            isActive: true
        });

        contests.push(newContest);
        emit ContestCreated(contests.length - 1, _contestName);
    }

    function submitAnswers(uint256 _contestId, uint256[] memory _selectedOptions) public {
        require(_contestId < contests.length, "Invalid contest ID");
        require(!hasParticipated[_contestId][msg.sender], "Already participated");
        require(contests[_contestId].isActive, "Contest is not active");
        require(_selectedOptions.length == contests[_contestId].questions.length, "Invalid number of answers");

        uint256 score = 0;
        for (uint256 i = 0; i < _selectedOptions.length; i++) {
            if (_selectedOptions[i] == contests[_contestId].questions[i].correctOptionIndex) {
                score++;
            }
        }

        hasParticipated[_contestId][msg.sender] = true;
        participantScores[_contestId][msg.sender] = score;
        emit ContestSubmitted(_contestId, msg.sender, score);
    }

    function getContest(uint256 _contestId) public view returns (Contest memory) {
        require(_contestId < contests.length, "Invalid contest ID");
        return contests[_contestId];
    }

    function getParticipantScore(uint256 _contestId, address _participant) public view returns (uint256) {
        require(_contestId < contests.length, "Invalid contest ID");
        return participantScores[_contestId][_participant];
    }
}
