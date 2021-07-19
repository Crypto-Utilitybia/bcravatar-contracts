const { expect } = require("chai");
const { ethers, getNamedAccounts, web3 } = require("hardhat");

describe("BCRAvatar", function () {
  const info = {
    ZERO: "0x0000000000000000000000000000000000000000",
    baseURI: `https://ipfs.io/ipfs/`,
  };

  before(async function () {
    const namedAccounts = await getNamedAccounts();
    info.deployer = namedAccounts.deployer;
    info.investor = namedAccounts.investor;
    info.investorSigner = await ethers.provider.getSigner(info.investor);
    info.avatarId = Date.now().toString();
    info.profileId = (Date.now() + 1).toString();
  });

  it("Contract Deploy", async function () {
    const { deployer } = info;

    const BCRAvatar = await ethers.getContractFactory("BCRAvatar");
    const contract = await BCRAvatar.deploy();
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
      `${info.baseURI}${avatarId.toString()}`
    );
    await expect(contract.setAvatar(avatarId)).to.be.revertedWith(
      "Account already registered"
    );
  });

  it("updateAvatar", async function () {
    info.avatarIdNew = Date.now().toString();
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
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("setProfile && getProfile", async function () {
    const { contract, deployer, profileId } = info;
    expect(await contract.getProfile(deployer)).to.equal("");
    await expect(contract.setProfile(profileId)).to.be.emit(
      contract,
      "ProfileCreated"
    );
    expect(await contract.getProfile(deployer)).to.equal(
      `${info.baseURI}${profileId.toString()}`
    );
    await expect(contract.setProfile(profileId)).to.be.revertedWith(
      "Account already registered"
    );
  });

  it("updateProfile", async function () {
    info.profileIdNew = Date.now().toString();
    const {
      contract,
      deployer,
      investorSigner: signer,
      profileId,
      profileIdNew,
    } = info;
    await expect(
      contract.connect(signer).updateProfile(profileId)
    ).to.be.revertedWith("Account not registered");
    await expect(contract.updateProfile(profileIdNew)).to.be.emit(
      contract,
      "ProfileUpdated"
    );
    expect(await contract.getProfile(deployer)).to.equal(
      `${info.baseURI}${profileIdNew.toString()}`
    );
  });

  it("registerERC721 && getAvatar", async function () {
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
    await mockNFT.mint(avatarNFT);

    await expect(contract.registerNFT(mockNFT.address, 1, false)).to.be
      .reverted;
    await expect(
      contract.connect(signer).registerNFT(mockNFT.address, 1, true)
    ).to.be.revertedWith("Owner invalid");

    await expect(contract.registerNFT(mockNFT.address, 1, true)).to.be.emit(
      contract,
      "NFTRegistered"
    );
    expect(await contract.getAvatar(deployer)).to.equal(avatarNFT);
    await mockNFT.transferFrom(deployer, info.investor, 1);
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("registerERC1155 && getAvatar", async function () {
    info.avatarNFT = `${info.baseURI}${Date.now()}/{id}.json`;
    const {
      contract,
      deployer,
      investorSigner: signer,
      avatarIdNew,
      avatarNFT,
    } = info;

    const MockERC1155 = await ethers.getContractFactory("MockERC1155");
    const mockNFT = await MockERC1155.deploy(avatarNFT);
    info.mockNFT = mockNFT;

    await expect(contract.registerNFT(mockNFT.address, 1, true)).to.be.reverted;
    await expect(
      contract.connect(signer).registerNFT(mockNFT.address, 1, false)
    ).to.be.revertedWith("Balance insufficient");

    await expect(contract.registerNFT(mockNFT.address, 1, false)).to.be.emit(
      contract,
      "NFTRegistered"
    );
    expect(await contract.getAvatar(deployer)).to.equal(avatarNFT);
    await mockNFT.safeTransferFrom(deployer, info.investor, 1, 99, "0x00");
    expect(await contract.getAvatar(deployer)).to.equal(avatarNFT);
    await mockNFT.safeTransferFrom(deployer, info.investor, 1, 1, "0x00");
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("deRegisterNFT && getAvatar", async function () {
    const {
      contract,
      deployer,
      investorSigner: signer,
      avatarIdNew,
      mockNFT,
      avatarNFT,
    } = info;

    await expect(contract.connect(signer).deRegisterNFT()).to.be.revertedWith(
      "NFT not registered"
    );
    await expect(contract.registerNFT(mockNFT.address, 2, false)).to.be.emit(
      contract,
      "NFTRegistered"
    );
    expect(await contract.getAvatar(deployer)).to.equal(avatarNFT);
    await expect(contract.deRegisterNFT()).to.be.emit(
      contract,
      "NFTDeRegistered"
    );
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("donate && withdraw", async function () {
    const { contract, investorSigner: signer, investor } = info;
    await expect(
      contract.connect(signer).donate({ value: web3.utils.toWei("1") })
    ).to.be.emit(contract, "ServiceDonated");
    expect(await web3.eth.getBalance(contract.address)).to.equal(
      web3.utils.toWei("1")
    );
    expect(await contract.balanceOf(investor)).to.equal(web3.utils.toWei("1"));
    await expect(contract.connect(signer).withdraw()).to.be.reverted;
    await contract.withdraw();
  });
});
