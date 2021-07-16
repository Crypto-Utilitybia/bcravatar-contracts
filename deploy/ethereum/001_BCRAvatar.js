const func = async function (hre) {
  const baseURI = `https://ipfs.io/ipfs/${process.env.IPFS_CID}/`;
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("BCRAvatar", {
    from: deployer,
    log: true,
    args: [baseURI],
  });
};

func.tags = ["BCRAvatar"];
module.exports = func;
