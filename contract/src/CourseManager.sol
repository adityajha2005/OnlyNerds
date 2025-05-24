// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract CourseManager {

    enum CourseCategory {
        Web3,
        Ml,
        FullStack,
        Marketing,
        Design
    }

    enum CourseLevel {
        Beginner,
        Intermediate,
        Advanced
    }

    address s_admin;
    Course[] s_courses;
    struct Course {
        uint256 courseId;
        string courseName;
        uint256 coursePrice;
        address courseOwner;
        address courseManager;
        address[] courseStudents;
        bool isCourseActive;
        uint256 earnings;
        CourseCategory category;
        CourseLevel level;
        // mapping(address => bool) isCourseStudent;
        // mapping(address => bool) isCourseTeacher;
        // mapping(address => bool) isCourseAdmin;
    }

    mapping(address => Course[]) s_coursesByOwner;

    modifier onlyCourseOwner(uint256 _courseId) {
        Course memory course = getCourseByCourseId(_courseId, msg.sender);
        require(course.courseOwner == msg.sender, "Only the course owner can perform this action");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == s_admin, "Only the admin can perform this action");
        _;
    }


    event CourseCreated(string courseName, uint256 price, CourseCategory category, CourseLevel level);
    event CoursePurchased(address indexed buyer, string courseName, uint256 price);

    constructor() {
        s_admin = msg.sender;
    }

    function createCourse(string memory _courseName, uint256 _coursePrice, CourseCategory _category, CourseLevel _level) public {
        Course memory newCourse = Course({
            courseId: s_courses.length,
            courseName: _courseName,
            coursePrice: _coursePrice,
            courseOwner: msg.sender,
            courseManager: address(this),
            courseStudents: new address[](0),
            isCourseActive: true,
            category: _category,
            level: _level,
            earnings: 0
        });
        
        s_courses.push(newCourse);
        s_coursesByOwner[msg.sender].push(newCourse);
        emit CourseCreated(_courseName, _coursePrice, _category, _level);
    }

    function getCoursesByOwner(address _owner) public view returns (Course[] memory) {
        return s_coursesByOwner[_owner];
    }

    function buyCourse(uint256 _courseId, address _owner) public payable {
        Course[] storage courses = s_coursesByOwner[_owner];
        for (uint256 i = 0; i < courses.length; i++) {
            if (courses[i].courseId == _courseId) {
                require(courses[i].isCourseActive, "Course is not active");
                require(msg.value == courses[i].coursePrice, "Incorrect payment amount");
                courses[i].courseStudents.push(msg.sender);
                courses[i].earnings += msg.value;
                emit CoursePurchased(msg.sender, courses[i].courseName, courses[i].coursePrice);
                return;
            }
        }
        revert("Course not found");
    }

    function getCourseByCourseId(uint256 _courseId, address _owner) public view returns (Course memory) {
        Course[] storage courses = s_coursesByOwner[_owner];
        require(courses.length > 0, "No courses found for this owner");
        for (uint256 i = 0; i < courses.length; i++) {
            if (courses[i].courseId == _courseId) {
                // require(courses[i].isCourseActive, "Course is not active");
                return courses[i];
            }
        }
        revert("Course not found");
    }  

    function withdrawMoney(uint256 _courseId) public onlyCourseOwner(_courseId) {
        Course[] storage courses = s_coursesByOwner[msg.sender];
        for (uint256 i = 0; i < courses.length; i++) {
            if (courses[i].courseId == _courseId) {
                require(courses[i].earnings > 0, "No earnings to withdraw");
                uint256 amount = courses[i].earnings;
                courses[i].earnings = 0;
                payable(msg.sender).transfer(amount);
                return;
            }
        }
        revert("Course not found");
    }

    function banCourse(uint256 _courseId, address _owner) public onlyAdmin() {
        Course[] storage courses = s_coursesByOwner[_owner];
        for (uint256 i = 0; i < courses.length; i++) {
            if (courses[i].courseId == _courseId) {
                courses[i].isCourseActive = false;
                return;
            }
        }
        revert("Course not found");
    }

}