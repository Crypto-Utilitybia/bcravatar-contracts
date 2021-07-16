const { expect } = require("chai");
const { ethers, getNamedAccounts, web3 } = require("hardhat");

describe("BCRAvatar", function () {
  const info = {
    ZERO: "0x0000000000000000000000000000000000000000",
    baseURI: `https://ipfs.io/ipfs/${process.env.IPFS_CID}/`,
  };

  before(async function () {
    const namedAccounts = await getNamedAccounts();
    info.deployer = namedAccounts.deployer;
    info.investor = namedAccounts.investor;
    info.investorSigner = await ethers.provider.getSigner(info.investor);
    info.avatarId = Date.now();
  });

  it("Contract Deploy", async function () {
    const { deployer, baseURI } = info;

    const BCRAvatar = await ethers.getContractFactory("BCRAvatar");
    const contract = await BCRAvatar.deploy(baseURI);
    info.contract = contract;

    expect(await contract.name()).to.equal("Blockchain Registered Avatar");
    expect(await contract.symbol()).to.equal("BCRA");
    expect(await contract.decimals()).to.equal(18);
    expect(await contract.owner()).to.equal(deployer);
  });

  it("setAvatar && getAvatar", async function () {
    const { contract, deployer, avatarId } = info;
    expect(await contract.getAvatar(deployer)).to.equal("");
    await expect(contract.setAvatar(avatarId)).to.be.emit(
      contract,
      "AvatarCreated"
    );
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${deployer.toLowerCase()}/${avatarId.toString()}`
    );
    await expect(contract.setAvatar(avatarId)).to.be.revertedWith(
      "Account already registered"
    );
  });

  it("updateAvatar", async function () {
    info.avatarIdNew = Date.now();
    const {
      contract,
      deployer,
      investorSigner: signer,
      avatarId,
      avatarIdNew,
    } = info;
    await expect(
      contract.connect(signer).updateAvatar(avatarId)
    ).to.be.revertedWith("Account not registered");
    await expect(contract.updateAvatar(avatarIdNew)).to.be.emit(
      contract,
      "AvatarUpdated"
    );
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${deployer.toLowerCase()}/${avatarIdNew.toString()}`
    );
  });

  it("registerNFT && getAvatar", async function () {
    info.avatarNFT = `${info.baseURI}${Date.now()}`;
    const {
      contract,
      deployer,
      investorSigner: signer,
      avatarIdNew,
      avatarNFT,
    } = info;

    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const mockNFT = await MockERC721.deploy();
    await mockNFT.mint(avatarNFT);

    await expect(contract.registerNFT(mockNFT.address, 2)).to.be.reverted;
    await expect(
      contract.connect(signer).registerNFT(mockNFT.address, 1)
    ).to.be.revertedWith("Owner invalid");
    await expect(contract.registerNFT(mockNFT.address, 1)).to.be.emit(
      contract,
      "NFTRegistered"
    );
    expect(await contract.getAvatar(deployer)).to.equal(avatarNFT);
    await mockNFT.transferFrom(deployer, info.investor, 1);
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${deployer.toLowerCase()}/${avatarIdNew.toString()}`
    );
  });

  it("donate && withdraw", async function () {
    const { contract, investorSigner: signer } = info;
    await expect(
      contract.connect(signer).donate({ value: web3.utils.toWei("1") })
    ).to.be.emit(contract, "ServiceDonated");
    expect(await web3.eth.getBalance(contract.address)).to.equal(
      web3.utils.toWei("1")
    );
    await expect(contract.connect(signer).withdraw()).to.be.reverted;
    await contract.withdraw();
  });
});