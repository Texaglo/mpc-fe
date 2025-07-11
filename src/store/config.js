/* -- set app title --*/
const AppTitle = 'ADMIN MODERN POKER';

/* -- set app mode -- */
// const AppMode = [''];
const AppMode = ['development'];

/* -- set API URLs --*/
// const development = 'https://dserver.modernpokerclub.com';
const development = 'http://localhost:4000';
const production = 'https://dserver.modernpokerclub.com';
const testing = 'https://dserver.modernpokerclub.com';

let SocketUrl;
let env = AppMode[0] || 'development', networkId = '', message = '', explorer = '';
switch (AppMode[0]) {
  case 'development':
    networkId = 1;
    SocketUrl = development;
    explorer = 'https://etherscan.io'
    message = 'Please switch your network to Ethereum Mainnet';
    break;
  case 'production':
    networkId = 1;
    SocketUrl = production;
    explorer = 'https://etherscan.io'
    message = 'Please switch your network to Ethereum Mainnet';
    break;
  case 'testing':
    networkId = 5;
    SocketUrl = testing;
    explorer = 'https://goerli.etherscan.io/';
    message = 'Please switch your network to Goerli testnet';
    break;
  default:
    // networkId = 5;
    // SocketUrl = 'http://192.168.18.106:4000';
    SocketUrl = 'http://localhost:4000';
  // explorer = 'https://goerli.etherscan.io/';
  // message = 'Please switch your network to Goerli testnet';
}

let ApiUrl = `${SocketUrl}/api`;
export { AppTitle, ApiUrl, SocketUrl, networkId, message, explorer, env };