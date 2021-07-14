//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract BCRAvatar is Ownable, ERC20 {
	struct AvatarNFT {
		address _contract;
		uint256 tokenId;
	}

	event AvatarCreated(address indexed account, string avatarURI);
	event AvatarUpdated(address indexed account, string avatarURI);
	event NFTRegistered(address indexed account, AvatarNFT nft);
	event ServiceDonated(address indexed account, uint256 amount);

	string public baseURI;
	mapping(address => uint256) public donations;

	mapping(address => uint256) private avatars;
	mapping(address => AvatarNFT) private avatarNFTs;

	constructor(string memory _baseURI) ERC20("Blockchain Registered Avatar", "BCRA") {
		baseURI = _baseURI;
	}

	function setBaseURI(string memory _baseURI) public onlyOwner {
		baseURI = _baseURI;
	}

	function setAvatar(uint256 avatarId) public {
		require(avatars[msg.sender] == 0, "Account already registered");
		avatars[msg.sender] = avatarId;
		emit AvatarCreated(msg.sender, getAvatar(msg.sender));
	}

	function getAvatar(address account) public view returns (string memory) {
		if (avatarNFTs[account]._contract != address(0)) {
			address _contract = avatarNFTs[account]._contract;
			uint256 tokenId = avatarNFTs[account].tokenId;
			if (IERC721(_contract).ownerOf(tokenId) == account) {
				return IERC721Metadata(_contract).tokenURI(tokenId);
			}
		}
		if (avatars[account] > 0) {
			return string(abi.encodePacked(baseURI, toAsciiString(account), "/", Strings.toString(avatars[account])));
		} else {
			return "";
		}
	}

	function updateAvatar(uint256 avatarId) public {
		require(avatars[msg.sender] != 0, "Account not registered");
		avatars[msg.sender] = avatarId;
		emit AvatarUpdated(msg.sender, getAvatar(msg.sender));
	}

	function registerNFT(address _contract, uint256 tokenId) public {
		require(IERC721(_contract).ownerOf(tokenId) == msg.sender, "Owner invalid");
		avatarNFTs[msg.sender] = AvatarNFT(_contract, tokenId);
		emit NFTRegistered(msg.sender, avatarNFTs[msg.sender]);
	}

	function donate() public payable {
		require(msg.value > 0, "Donation insufficient");
		super._mint(msg.sender, 100 ether);
		donations[msg.sender] += msg.value;
		emit ServiceDonated(msg.sender, msg.value);
	}

	receive() external payable {}

	function withdraw() public onlyOwner {
		require(address(this).balance > 0, "Amount insufficient");
		payable(owner()).transfer(address(this).balance);
	}

	function toAsciiString(address x) internal pure returns (string memory) {
		bytes memory alphabet = "0123456789abcdef";
		bytes memory s = new bytes(42);
		s[0] = "0";
		s[1] = "x";
		for (uint256 i = 0; i < 20; i++) {
			bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8 * (19 - i)))));
			uint8 hi = uint8(uint8(b) / 16);
			uint8 lo = uint8(uint8(b) - 16 * uint8(hi));
			s[2 * i + 2] = alphabet[hi];
			s[2 * i + 3] = alphabet[lo];
		}
		return string(s);
	}
}
