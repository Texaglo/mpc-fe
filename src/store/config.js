/* -- set app title -- */
const AppTitle = 'FRONTEND MODERN POKER CLUB';

/* -- set app mode -- */
const AppMode = ['production', 'development', 'testing', 'localhost']; 

/* -- set API URLs -- */
const testing = 'https://dserver.modernpokerclub.com';
const production = process.env.REACT_APP_API_BASE_URL || 'https://pserver.modernpokerclub.com';
const development = 'https://dserver.modernpokerclub.com';
const localhost = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

let SocketUrl, opensea;
const configuredEnv = process.env.REACT_APP_APP_MODE;
let env = AppMode.includes(configuredEnv) ? configuredEnv : (AppMode[0] ?? 'development');
let networkId = '', message = '', explorer = '', solanaExplorer = '', solanCluster = '', AlchemyUrl= '';
const localBridgeNftAddress = process.env.REACT_APP_LOCAL_BRIDGE_NFT_CONTRACT || '';
const localBridgeNftMaxTokenId = Number(process.env.REACT_APP_LOCAL_BRIDGE_NFT_MAX_TOKEN_ID || 25);
const localBridgeRpcUrl = process.env.REACT_APP_LOCAL_EVM_RPC_URL || 'http://127.0.0.1:8545';
const localSolanaRpcUrl = process.env.REACT_APP_LOCAL_SOLANA_RPC_URL || 'http://127.0.0.1:8899';
const isLocalBridgeTesting = env === 'localhost' && process.env.REACT_APP_ENABLE_LOCAL_BRIDGE_TEST_PANEL !== 'false';
const bridgeAllowedEthCollection = (process.env.REACT_APP_BRIDGE_ALLOWED_ETH_COLLECTION || '0x87Ba7EEB098D25052f4e5299e2880E97285E344f').toLowerCase();
const bridgeReplacementMetadataBaseUrl = (process.env.REACT_APP_BRIDGE_REPLACEMENT_METADATA_BASE_URL || 'https://mpc-collection-mint-burn-json.s3.us-east-2.amazonaws.com').replace(/\/$/, '');
const bridgeDonorImageBaseUrl = (process.env.REACT_APP_BRIDGE_DONOR_IMAGE_BASE_URL || 'https://mpc-collection-images.s3.us-east-2.amazonaws.com').replace(/\/$/, '');
const bridgeDonorImageTokenOffset = Number(process.env.REACT_APP_BRIDGE_DONOR_IMAGE_TOKEN_OFFSET || 1);

switch (env) {
  case 'development':
    networkId = 11155111;
    SocketUrl = development;
    explorer = 'https://sepolia.etherscan.io';
    message = 'Please switch your network to Sepolia testnet';
    opensea = 'https://testnets.opensea.io/';
    solanaExplorer = 'https://explorer.solana.com';
    solanCluster = 'devnet';
    AlchemyUrl = 'https://eth-sepolia.g.alchemy.com'
    break;
  case 'production':
    networkId = 1;
    SocketUrl = production;
    message = 'Please switch your network to Ethereum Mainnet';
    explorer = 'https://etherscan.io';
    opensea = 'https://opensea.io/';
    solanaExplorer = 'https://explorer.solana.com';
    solanCluster = 'mainnet-beta';
    AlchemyUrl = 'https://eth-mainnet.g.alchemy.com'
    break;
  case 'testing':
    networkId = 11155111;
    SocketUrl = testing;
    message = 'Please switch your network to Sepolia testnet';
    explorer = 'https://sepolia.etherscan.io';
    opensea = 'https://testnets.opensea.io/';
    solanaExplorer = 'https://explorer.solana.com';
    solanCluster = 'devnet';
    AlchemyUrl = 'https://eth-sepolia.g.alchemy.com'
    break;
  default:
    networkId = Number(process.env.REACT_APP_LOCAL_EVM_CHAIN_ID || 31337);
    SocketUrl = localhost;
    message = 'Please switch your network to Hardhat localhost';
    explorer = process.env.REACT_APP_LOCAL_EVM_EXPLORER || 'http://127.0.0.1:8545';
    opensea = 'https://testnets.opensea.io/';
    solanaExplorer = process.env.REACT_APP_LOCAL_SOLANA_EXPLORER || 'https://explorer.solana.com';
    solanCluster = process.env.REACT_APP_LOCAL_SOLANA_CLUSTER || 'custom';
    AlchemyUrl = 'http://127.0.0.1:8545'
}

let ApiUrl = `${SocketUrl}/api`;
const localEvmChain = {
  chainId: `0x${Number(networkId || 31337).toString(16)}`,
  chainName: process.env.REACT_APP_LOCAL_EVM_CHAIN_NAME || 'Hardhat Localhost 31337',
  nativeCurrency: {
    name: 'Local Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [localBridgeRpcUrl],
};
const solanaExplorerClusterQuery = solanCluster === 'custom'
  ? `cluster=custom&customUrl=${encodeURIComponent(localSolanaRpcUrl)}`
  : `cluster=${solanCluster}`;

export { AppTitle, ApiUrl, SocketUrl, opensea, networkId, message, explorer, env, solanaExplorer, solanCluster, solanaExplorerClusterQuery, AlchemyUrl, localBridgeNftAddress, localBridgeNftMaxTokenId, localBridgeRpcUrl, localSolanaRpcUrl, isLocalBridgeTesting, localEvmChain, bridgeAllowedEthCollection, bridgeReplacementMetadataBaseUrl, bridgeDonorImageBaseUrl, bridgeDonorImageTokenOffset };
