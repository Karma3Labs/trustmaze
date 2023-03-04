require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    matic: {
      url: "https://polygon-testnet.public.blastapi.io",
      accounts: [process.env.PK],
      chainId: 80001,
    }
  }
};
