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
    info.avatarIdNew = (Date.now() + 1).toString();
    info.profileId = (Date.now() + 2).toString();
    info.profileIdNew = (Date.now() + 3).toString();
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

  it("Set Avatar", async function () {
    const { contract, deployer, avatarId, avatarIdNew } = info;
    expect(await contract.getAvatar(deployer)).to.equal("");
    await expect(contract.setAvatar(avatarId)).to.be.emit(
      contract,
      "AvatarCreated"
    );
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${avatarId.toString()}`
    );
    await expect(contract.setAvatar(avatarIdNew)).to.be.emit(
      contract,
      "AvatarUpdated"
    );
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("Set Profile", async function () {
    const { contract, deployer, profileId, profileIdNew } = info;
    expect(await contract.getProfile(deployer)).to.equal("");
    await expect(contract.setProfile(profileId)).to.be.emit(
      contract,
      "ProfileCreated"
    );
    expect(await contract.getProfile(deployer)).to.equal(
      `${info.baseURI}${profileId.toString()}`
    );
    await expect(contract.setProfile(profileIdNew)).to.be.emit(
      contract,
      "ProfileUpdated"
    );
    expect(await contract.getProfile(deployer)).to.equal(
      `${info.baseURI}${profileIdNew.toString()}`
    );
  });

  it("Register NFT(ERC721)", async function () {
    info.avatarNFT = `${info.baseURI}${Date.now()}`;
    const {
      contract,
      deployer,
      investorSigner: signer,
      avatarIdNew,
      avatarNFT,
    } = info;

    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const mockERC721 = await MockERC721.deploy();
    await mockERC721.mint(avatarNFT);
    await mockERC721.mint(avatarNFT);
    info.mockERC721 = mockERC721;

    await expect(contract.registerNFT(mockERC721.address, 1, false)).to.be
      .reverted;
    await expect(
      contract.connect(signer).registerNFT(mockERC721.address, 1, true)
    ).to.be.revertedWith("Owner invalid");

    await expect(contract.registerNFT(mockERC721.address, 1, true)).to.be.emit(
      contract,
      "NFTRegistered"
    );
    expect(await contract.getAvatar(deployer)).to.equal(avatarNFT);
    await mockERC721.transferFrom(deployer, info.investor, 1);
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("Register NFT(ERC1155)", async function () {
    info.avatarNFT = `${info.baseURI}${Date.now()}/{id}.json`;
    const {
      contract,
      deployer,
      investorSigner: signer,
      avatarIdNew,
      avatarNFT,
    } = info;

    const MockERC1155 = await ethers.getContractFactory("MockERC1155");
    const mockERC1155 = await MockERC1155.deploy(avatarNFT);
    info.mockERC1155 = mockERC1155;

    await expect(contract.registerNFT(mockERC1155.address, 1, true)).to.be
      .reverted;
    await expect(
      contract.connect(signer).registerNFT(mockERC1155.address, 1, false)
    ).to.be.revertedWith("Balance insufficient");

    await expect(
      contract.registerNFT(mockERC1155.address, 1, false)
    ).to.be.emit(contract, "NFTRegistered");
    expect(await contract.getAvatar(deployer)).to.equal(avatarNFT);
    await mockERC1155.safeTransferFrom(deployer, info.investor, 1, 99, "0x00");
    expect(await contract.getAvatar(deployer)).to.equal(avatarNFT);
    await mockERC1155.safeTransferFrom(deployer, info.investor, 1, 1, "0x00");
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("DeRegister NFT", async function () {
    const {
      contract,
      deployer,
      investorSigner: signer,
      avatarIdNew,
      mockERC1155,
      avatarNFT,
    } = info;

    await expect(contract.connect(signer).deRegisterNFT()).to.be.revertedWith(
      "NFT not registered"
    );
    await expect(
      contract.registerNFT(mockERC1155.address, 2, false)
    ).to.be.emit(contract, "NFTRegistered");
    expect(await contract.getAvatar(deployer)).to.equal(avatarNFT);
    await expect(contract.deRegisterNFT()).to.be.emit(
      contract,
      "NFTDeRegistered"
    );
    expect(await contract.getAvatar(deployer)).to.equal(
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("Set Avatar (Contract)", async function () {
    const {
      contract,
      mockERC721,
      investorSigner: signer,
      avatarId,
      avatarIdNew,
    } = info;
    expect(await contract.getAvatar(mockERC721.address)).to.equal("");
    await expect(
      contract.connect(signer).setContractAvatar(mockERC721.address, avatarId)
    ).to.be.reverted;
    await expect(
      contract.setContractAvatar(mockERC721.address, avatarId)
    ).to.be.emit(contract, "ContractAvatarCreated");
    expect(await contract.getAvatar(mockERC721.address)).to.equal(
      `${info.baseURI}${avatarId.toString()}`
    );
    await expect(
      contract.setContractAvatar(mockERC721.address, avatarIdNew)
    ).to.be.emit(contract, "ContractAvatarUpdated");
    expect(await contract.getAvatar(mockERC721.address)).to.equal(
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("Set Avatar (Owned Contract)", async function () {
    const {
      contract,
      mockERC1155,
      investor,
      investorSigner: signer,
      avatarId,
      avatarIdNew,
    } = info;
    await mockERC1155.transferOwnership(investor);
    expect(await contract.getAvatar(mockERC1155.address)).to.equal("");
    await expect(
      contract.setOwnableContractAvatar(mockERC1155.address, avatarId)
    ).to.be.reverted;
    await expect(
      contract
        .connect(signer)
        .setOwnableContractAvatar(mockERC1155.address, avatarId)
    ).to.be.emit(contract, "ContractAvatarCreated");
    expect(await contract.getAvatar(mockERC1155.address)).to.equal(
      `${info.baseURI}${avatarId.toString()}`
    );
    await expect(
      contract
        .connect(signer)
        .setOwnableContractAvatar(mockERC1155.address, avatarIdNew)
    ).to.be.emit(contract, "ContractAvatarUpdated");
    expect(await contract.getAvatar(mockERC1155.address)).to.equal(
      `${info.baseURI}${avatarIdNew.toString()}`
    );
  });

  it("Set Profile (Contract)", async function () {
    const {
      contract,
      mockERC721,
      investorSigner: signer,
      profileId,
      profileIdNew,
    } = info;
    expect(await contract.getProfile(mockERC721.address)).to.equal("");
    await expect(
      contract.connect(signer).setContractProfile(mockERC721.address, profileId)
    ).to.be.reverted;
    await expect(
      contract.setContractProfile(mockERC721.address, profileId)
    ).to.be.emit(contract, "ContractProfileCreated");
    expect(await contract.getProfile(mockERC721.address)).to.equal(
      `${info.baseURI}${profileId.toString()}`
    );
    await expect(
      contract.setContractProfile(mockERC721.address, profileIdNew)
    ).to.be.emit(contract, "ContractProfileUpdated");
    expect(await contract.getProfile(mockERC721.address)).to.equal(
      `${info.baseURI}${profileIdNew.toString()}`
    );
  });

  it("Set Profile (Owned Contract)", async function () {
    const {
      contract,
      mockERC1155,
      investor,
      investorSigner: signer,
      profileId,
      profileIdNew,
    } = info;
    expect(await contract.getProfile(mockERC1155.address)).to.equal("");
    await expect(
      contract.setOwnableContractProfile(mockERC1155.address, profileId)
    ).to.be.reverted;
    await expect(
      contract
        .connect(signer)
        .setOwnableContractProfile(mockERC1155.address, profileId)
    ).to.be.emit(contract, "ContractProfileCreated");
    expect(await contract.getProfile(mockERC1155.address)).to.equal(
      `${info.baseURI}${profileId.toString()}`
    );
    await expect(
      contract
        .connect(signer)
        .setOwnableContractProfile(mockERC1155.address, profileIdNew)
    ).to.be.emit(contract, "ContractProfileUpdated");
    expect(await contract.getProfile(mockERC1155.address)).to.equal(
      `${info.baseURI}${profileIdNew.toString()}`
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
