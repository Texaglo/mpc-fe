/* -- set app title --*/
const AppTitle = 'ADMIN MODERN POKER';

/* -- set app mode -- */
// const AppMode = [''];
// Contract artifacts currently live under `contract/development`, while the
// second value selects the remote API/socket environment.
const AppMode = ['development', process.env.REACT_APP_ADMIN_API_ENV || 'production'];

/* -- set API URLs --*/
const development = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:4000';
// const development = 'https://dserver.modernpokerclub.com';
//const production = 'https://dserver.modernpokerclub.com';
const production = process.env.REACT_APP_ADMIN_PRODUCTION_URL || 'https://mpc.texaglo.com';

//const testing = 'https://dserver.modernpokerclub.com';
const testing = process.env.REACT_APP_ADMIN_TESTING_URL || 'https://mpc.texaglo.com';

let SocketUrl;
let env = AppMode[0] || 'production', networkId = '', message = '', explorer = '';
switch (AppMode[1]) {
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
    // SocketUrl = 'http://localhost:4000';
    SocketUrl = development;
  // explorer = 'https://goerli.etherscan.io/';
  // message = 'Please switch your network to Goerli testnet';
}

let ApiUrl = `${SocketUrl}/api`;
export { AppTitle, ApiUrl, SocketUrl, networkId, message, explorer, env };
