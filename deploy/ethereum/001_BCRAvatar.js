require("dotenv").config();

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function func() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const BCRAvatar = await hre.ethers.getContractFactory("BCRAvatar");
  const baseURI = `https://ipfs.io/ipfs/${process.env.IPFS_CID}/`;
  const contract = await BCRAvatar.deploy(baseURI);

  await contract.deployed();

  console.log("BCRAvatar deployed to:", contract.address);
}

func.tags = ["BCRAvatar"];
module.exports = func;
