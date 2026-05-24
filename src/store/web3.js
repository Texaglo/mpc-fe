import Web3 from "web3";

// Initialize web3 instance
let web3;

// Check if window.ethereum is available
if (window.ethereum) {
    // If Ethereum provider is available, use it
    web3 = new Web3(window.ethereum);

    // Request user accounts to connect with MetaMask (or another provider)
    // window.ethereum.request({ method: 'eth_requestAccounts' })
    //     .then((accounts) => {
    //         console.log("Connected accounts: ", accounts);
    //         // You can store the accounts in your state or any global variable if needed
    //     })
    //     .catch((err) => {
    //         console.error("Error connecting to MetaMask:", err);
    //     });
} else {
    console.error("Ethereum provider (MetaMask or other) is not available.");
}

export { web3 };