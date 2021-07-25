require("dotenv").config();

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");

require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");

require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-gas-reporter");
require("hardhat-abi-exporter");

require("solidity-coverage");

const INFURA_ID = process.env.INFURA_ID;
const privateKey = process.env.PRIVATE_KEY;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    // hardhat: {
    //   forking: {
    //     url: "https://rinkeby.infura.io/v3/" + INFURA_ID,
    //   },
    // },
    localhost: {
      url: "http://localhost:8545",
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/" + INFURA_ID,
      accounts: [`${privateKey}`],
      saveDeployments: true,
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + INFURA_ID,
      accounts: [`${privateKey}`],
      saveDeployments: true,
    },
    binance: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      deploy: ["deploy/binance"],
    },
    matic: {
      url: "https://rpc-mainnet.maticvigil.com",
      accounts: [`${privateKey}`],
      chainId: 137,
      live: true,
      saveDeployments: true,
      gasMultiplier: 2,
      deploy: ["deploy/matic"],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
    investor: 1,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  abiExporter: {
    clear: true,
    flat: true,
    spacing: 2,
    only: ["BCRAvatar", "IERC721", "IERC1155"],
  },
  mocha: {
    timeout: 0,
  },
  paths: {
    deploy: "deploy/ethereum",
    sources: "./contracts",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
