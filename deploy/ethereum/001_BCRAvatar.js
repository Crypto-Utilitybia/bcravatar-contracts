const func = async function (hre) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("BCRAvatar", {
    from: deployer,
    log: true,
    args: [],
  });

  const hasAvatar = await read("BCRAvatar", "getAvatar", deployer);
  if (!hasAvatar) {
    await execute(
      "BCRAvatar",
      { from: deployer, log: true },
      "setAvatar",
      process.env.AVATAR_ID
    );
  } else {
    console.log(`Avatar: ${hasAvatar}`);
  }

  const hasProfile = await read("BCRAvatar", "getProfile", deployer);
  if (!hasProfile) {
    await execute(
      "BCRAvatar",
      { from: deployer, log: true },
      "setProfile",
      process.env.PROFILE_ID
    );
  } else {
    console.log(`Profile: ${hasProfile}`);
  }
};

func.tags = ["BCRAvatar"];
module.exports = func;
