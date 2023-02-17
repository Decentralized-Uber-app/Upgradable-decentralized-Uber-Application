require("dotenv").config({ path: ".env" });
import "@nomicfoundation/hardhat-toolbox";
require("@nomiclabs/hardhat-etherscan");
import "@nomiclabs/hardhat-ethers";



//contract address key
const ACCOUNT_PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.17",
  networks: {
    hyperspace: {
        chainId: 3141,
        url: "https://api.hyperspace.node.glif.io/rpc/v1",
        accounts: [ACCOUNT_PRIVATE_KEY],
    },
},
  // settings: {
  //   optimizer: {
  //     enabled: true,
  //     runs: 490,
  //   },
  // },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};
