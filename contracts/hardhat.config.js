require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [
        process.env.PRIVATE_KEY || "e2f04fdced459d587332c8abaa9e0a168a6a6ca18a556b2c8b422792f0e04bcb"
      ]
    },
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [
        process.env.PRIVATE_KEY || "e2f04fdced459d587332c8abaa9e0a168a6a6ca18a556b2c8b422792f0e04bcb"
      ]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || ""
    }
  }
};
