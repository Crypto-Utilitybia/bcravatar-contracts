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
	event ProfileCreated(address indexed account, string profileURI);
	event ProfileUpdated(address indexed account, string profileURI);
	event NFTRegistered(address indexed account, AvatarNFT nft);
	event ServiceDonated(address indexed account, uint256 amount);

	string public baseURI;
	mapping(address => uint256) public donations;

	mapping(address => string) private avatars;
	mapping(address => string) private profiles;
	mapping(address => AvatarNFT) private avatarNFTs;

	constructor(string memory _baseURI) ERC20("Blockchain Registered Avatar", "BCRA") {
		baseURI = _baseURI;
	}

	function setBaseURI(string memory _baseURI) public onlyOwner {
		baseURI = _baseURI;
	}

	function setAvatar(string memory avatarHash) public {
		require(bytes(avatars[msg.sender]).length == 0, "Account already registered");
		avatars[msg.sender] = avatarHash;
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
		if (bytes(avatars[account]).length > 0) {
			return string(abi.encodePacked(baseURI, avatars[account]));
		} else {
			return "";
		}
	}

	function updateAvatar(string memory avatarHash) public {
		require(bytes(avatars[msg.sender]).length != 0, "Account not registered");
		avatars[msg.sender] = avatarHash;
		emit AvatarUpdated(msg.sender, getAvatar(msg.sender));
	}

	function setProfile(string memory profileHash) public {
		require(bytes(profiles[msg.sender]).length == 0, "Account already registered");
		profiles[msg.sender] = profileHash;
		emit ProfileCreated(msg.sender, getProfile(msg.sender));
	}

	function getProfile(address account) public view returns (string memory) {
		if (bytes(profiles[account]).length > 0) {
			return string(abi.encodePacked(baseURI, profiles[account]));
		} else {
			return "";
		}
	}

	function updateProfile(string memory profileHash) public {
		require(bytes(profiles[msg.sender]).length != 0, "Account not registered");
		profiles[msg.sender] = profileHash;
		emit ProfileUpdated(msg.sender, getProfile(msg.sender));
	}

	function registerNFT(address _contract, uint256 tokenId) public {
		require(IERC721(_contract).ownerOf(tokenId) == msg.sender, "Owner invalid");
		avatarNFTs[msg.sender] = AvatarNFT(_contract, tokenId);
		emit NFTRegistered(msg.sender, avatarNFTs[msg.sender]);
	}

	function donate() public payable {
		require(msg.value > 0, "Donation insufficient");
		super._mint(msg.sender, msg.value);
		donations[msg.sender] += msg.value;
		emit ServiceDonated(msg.sender, msg.value);
	}

	function withdraw() public onlyOwner {
		require(address(this).balance > 0, "Amount insufficient");
		payable(owner()).transfer(address(this).balance);
	}
}
