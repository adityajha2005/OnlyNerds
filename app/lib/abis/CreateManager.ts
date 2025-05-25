const abi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "CourseCreated",
    inputs: [
      { name: "courseName", type: "string", indexed: false, internalType: "string" },
      { name: "price", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "category", type: "uint8", indexed: false, internalType: "enum CourseManager.CourseCategory" },
      { name: "level", type: "uint8", indexed: false, internalType: "enum CourseManager.CourseLevel" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "CoursePurchased",
    inputs: [
      { name: "buyer", type: "address", indexed: true, internalType: "address" },
      { name: "courseName", type: "string", indexed: false, internalType: "string" },
      { name: "price", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "function",
    name: "banCourse",
    inputs: [
      { name: "_courseId", type: "uint256", internalType: "uint256" },
      { name: "_owner", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "buyCourse",
    inputs: [
      { name: "_courseId", type: "uint256", internalType: "uint256" },
      { name: "_owner", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "createCourse",
    inputs: [
      { name: "_courseName", type: "string", internalType: "string" },
      { name: "_coursePrice", type: "uint256", internalType: "uint256" },
      { name: "_category", type: "uint8", internalType: "enum CourseManager.CourseCategory" },
      { name: "_level", type: "uint8", internalType: "enum CourseManager.CourseLevel" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getCourseByCourseId",
    inputs: [
      { name: "_courseId", type: "uint256", internalType: "uint256" },
      { name: "_owner", type: "address", internalType: "address" }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct CourseManager.Course",
        components: [
          { name: "courseId", type: "uint256", internalType: "uint256" },
          { name: "courseName", type: "string", internalType: "string" },
          { name: "coursePrice", type: "uint256", internalType: "uint256" },
          { name: "courseOwner", type: "address", internalType: "address" },
          { name: "courseManager", type: "address", internalType: "address" },
          { name: "courseStudents", type: "address[]", internalType: "address[]" },
          { name: "isCourseActive", type: "bool", internalType: "bool" },
          { name: "earnings", type: "uint256", internalType: "uint256" },
          { name: "category", type: "uint8", internalType: "enum CourseManager.CourseCategory" },
          { name: "level", type: "uint8", internalType: "enum CourseManager.CourseLevel" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getCoursesByOwner",
    inputs: [
      { name: "_owner", type: "address", internalType: "address" }
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct CourseManager.Course[]",
        components: [
          { name: "courseId", type: "uint256", internalType: "uint256" },
          { name: "courseName", type: "string", internalType: "string" },
          { name: "coursePrice", type: "uint256", internalType: "uint256" },
          { name: "courseOwner", type: "address", internalType: "address" },
          { name: "courseManager", type: "address", internalType: "address" },
          { name: "courseStudents", type: "address[]", internalType: "address[]" },
          { name: "isCourseActive", type: "bool", internalType: "bool" },
          { name: "earnings", type: "uint256", internalType: "uint256" },
          { name: "category", type: "uint8", internalType: "enum CourseManager.CourseCategory" },
          { name: "level", type: "uint8", internalType: "enum CourseManager.CourseLevel" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "withdrawMoney",
    inputs: [
      { name: "_courseId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  }
]

export default abi 