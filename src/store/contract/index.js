const { web3 } = require('../web3');
const { env } = require('../config');

const TokenData = require(`./${env}/Token.json`);
const ICOData = require(`./${env}/ICO.json`);

const networks = {
  0: 'Disconnected',
  1: 'Mainnet',
  4: 'Rinkeby',
  42: 'Kovan',
}

const TokenABI = TokenData['abi'];
const TokenAddress = TokenData['address'];
const Token = new web3.eth.Contract(TokenABI, TokenAddress);

const ICOABI = ICOData['abi'];
const ICOAddress = ICOData['address'];
const ICO = new web3.eth.Contract(ICOABI, ICOAddress);


module.exports = {
  Token, TokenABI, TokenAddress,
  ICO, ICOABI, ICOAddress,
};
