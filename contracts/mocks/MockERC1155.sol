// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MockERC1155 is ERC1155 {
	constructor(string memory uri) ERC1155(uri) {
		_mint(msg.sender, 1, 100, "");
		_mint(msg.sender, 2, 100, "");
	}
}
