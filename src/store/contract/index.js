const { web3 } = require('../web3');
const { env } = require('../config');

const TokenData = require(`./${env}/Token.json`);
const RewardData = require(`./${env}/Reward.json`);

const TokenABI = TokenData['abi'];
const TokenAddress = TokenData['address'];
const Token = new web3.eth.Contract(TokenABI, TokenAddress);

const RewardABI = RewardData['abi'];
const RewardAddress = RewardData['address'];
const Reward = new web3.eth.Contract(RewardABI, RewardAddress);

module.exports = {
  Token, TokenABI, TokenAddress,
  Reward, RewardABI, RewardAddress,
};
