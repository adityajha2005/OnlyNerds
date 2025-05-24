// // SPDX LICENCE-Identifier: UNLICENSED
pragma solidity ^0.8.20;
// import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


// contract NFTCertificate is ERC721 {
//     uint256 public tokenCounter;
//     address public courseManager;

//     event CertificateIssued(address indexed student, uint256 tokenId);

//     constructor() ERC721("CourseBadgeNFT", "CBNFT") {
//         tokenCounter = 0;
//         courseManager = msg.sender; // Set the course manager as the contract deployer
//     }

//     modifier onlyCourseManager() {
//         require(msg.sender == courseManager, "Only the course manager can issue certificates");
//         _;
//     }

//     function issueCourseBadgeNFT(address student) external onlyCourseManager {
//         uint256 tokenId = tokenCounter;
//         _mint(student, tokenId);
//         emit CertificateIssued(student, tokenId);
//         tokenCounter++;
//     }

//     function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
//         _tokenURIs[tokenId] = tokenURI;
//     }

//     function tokenURI(uint256 tokenId) public view override returns (string memory) {
//         return _tokenURIs[tokenId];
//     }
// }