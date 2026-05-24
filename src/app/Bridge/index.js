import EventBus from "eventing-bus";
import { connect } from 'react-redux';
import React, { Component } from 'react';
import Web3 from 'web3';
// import withNavigation from './withNavigation'; 

import './index.css';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Loader from '../../components/loader-bridge';
import { ApiUrl, explorer, solanaExplorer, solanaExplorerClusterQuery, isLocalBridgeTesting, localBridgeNftAddress, localBridgeRpcUrl, localEvmChain, localSolanaRpcUrl } from '../../store/config';
import { setBurnNftRecord, createBurnNftRecord, mintNewNft, setMintedNft, getBurnNftHistory, getWalletNft, setWalletNft, connectWalletSuccess } from '../../store/actions/Auth';
import { getInjectedEthereumProvider, requestEthereumAccounts, switchToConfiguredEvmNetwork } from '../../store/walletNetworks';
import BurnAbi from '../../store/contract/development/BurnABI.json'

const BRIDGE_BURN_ADDRESS = '0x000000000000000000000000000000000000dead';

class Bridge extends Component {
    constructor(props) {
        super(props);
        this.state = {
            solanaWallet: '',
            solanaBalance: null,
            solanaAssets: [],
            coreAssets: [],
            solanaRpcError: '',
            solanaBalanceLoading: false,
            solanaAssetsLoading: false,
            coreAssetsLoading: false,
            phantomConnected: false,
            evmNetworkId: null,
            transactionHash: '',
            burnNftRecord: { tokenId: null, contractAddress: null },
            isLoading: false

        };
    };

    async componentDidMount() {
        const { publicAddress } = this.props;
        if (publicAddress) {
            this.loadUserData(publicAddress);
        }
        if (isLocalBridgeTesting) {
            this.restorePhantomConnection();
        }
    };

    componentWillUnmount() {
        if (this.phantomProvider?.off) {
            this.phantomProvider.off('accountChanged', this.handlePhantomAccountChanged);
            this.phantomProvider.off('disconnect', this.handlePhantomDisconnect);
        }
    }

    async componentDidUpdate(prevProps) {
        const { publicAddress, isBurnNftRecord, nftMinted } = this.props;
        const { tokenId, contractAddress } = this.state.burnNftRecord;

        if (publicAddress && publicAddress !== prevProps.publicAddress) {
            this.loadUserData(publicAddress);
        }

        if (isBurnNftRecord === true && prevProps.isBurnNftRecord !== true && contractAddress && tokenId) {
            const txhash = await this.handleContractBurn(publicAddress, contractAddress, tokenId);
            if (txhash) {
                let data = { tokenId, contractAddress, EtherumWallet: publicAddress, transactionHashEtherum: txhash, status: 'burned' }
                this.props.setBurnNftRecord(false);
                await this.props.mintNewNft(data);
            } else {
                this.props.setBurnNftRecord(false);
                this.setState({ isLoading: false });
            }
        }

        if (isBurnNftRecord === false && nftMinted !== null && prevProps.nftMinted !== nftMinted) {
            await this.loadUserData(publicAddress);
            if (isLocalBridgeTesting && this.state.solanaWallet) {
                await this.refreshSolanaTestingData(this.state.solanaWallet);
            }
            this.props.setMintedNft(null)
            this.setState({ isLoading: false });
        }
    }

    loadUserData = async (publicAddress) => {
        try {
            setTimeout(() => {
                this.props.getBurnNftHistory(publicAddress);
            }, 0);
            await this.props.getWalletNft(publicAddress);
        } catch (e) {
            console.error('Error loading user data:', e);
        }

    };

    getShortAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    getSolanaExplorerUrl = (path, value) => `${solanaExplorer}/${path}/${value}?${solanaExplorerClusterQuery}`;

    getIpfsCid = (url) => {
        if (!url) return '';
        if (url.startsWith('ipfs://')) return url.replace('ipfs://', '');
        const ipfsIndex = url.indexOf('/ipfs/');
        return ipfsIndex >= 0 ? url.slice(ipfsIndex + '/ipfs/'.length) : '';
    };

    getImageCandidates = (url) => {
        const cid = this.getIpfsCid(url);
        if (!cid) return url ? [url] : [];

        return [
            `https://ipfs.io/ipfs/${cid}`,
            `https://gateway.pinata.cloud/ipfs/${cid}`,
            `https://nftstorage.link/ipfs/${cid}`,
            url,
        ];
    };

    getPrimaryImageUrl = (url) => this.getImageCandidates(url)[0] || '';

    getTokenNumericId = (value) => {
        const match = String(value || '').match(/\d+/);
        return match ? Number(match[0]) : 1;
    };

    getNftImageSrc = (imageUrl, tokenId) => (
        this.getPrimaryImageUrl(imageUrl)
    );

    handleImageError = (event, originalUrl, fallbackUrl = '') => {
        const image = event.currentTarget;
        const candidates = this.getImageCandidates(originalUrl);
        const currentIndex = Number(image.dataset.gatewayIndex || 0);
        const nextUrl = candidates[currentIndex + 1];

        if (nextUrl) {
            image.dataset.gatewayIndex = String(currentIndex + 1);
            image.src = nextUrl;
            return;
        }

        if (fallbackUrl && image.src !== fallbackUrl) {
            image.dataset.gatewayIndex = 'fallback';
            image.src = fallbackUrl;
            return;
        }

        image.style.display = 'none';
    };

    parseJsonResponse = async (response, fallbackMessage) => {
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (error) {
            const preview = text.replace(/\s+/g, ' ').slice(0, 80);
            throw new Error(`${fallbackMessage}: ${preview || response.statusText}`);
        }
    };

    getPhantomProvider = () => {
        if (typeof window === 'undefined') return null;
        const provider = window.phantom?.solana || window.solana;
        return provider?.isPhantom ? provider : null;
    };

    bindPhantomEvents = (provider) => {
        if (!provider || this.phantomProvider === provider) return;
        this.phantomProvider = provider;
        if (provider.on) {
            provider.on('accountChanged', this.handlePhantomAccountChanged);
            provider.on('disconnect', this.handlePhantomDisconnect);
        }
    };

    handlePhantomAccountChanged = async (publicKey) => {
        if (!publicKey) {
            this.handlePhantomDisconnect();
            return;
        }
        const address = publicKey.toString();
        this.setState({ solanaWallet: address, phantomConnected: true }, () => {
            this.refreshSolanaTestingData(address);
        });
    };

    handlePhantomDisconnect = () => {
        this.setState({
            phantomConnected: false,
            solanaBalance: null,
            solanaAssets: [],
            coreAssets: [],
            solanaRpcError: '',
        });
    };

    restorePhantomConnection = async () => {
        const provider = this.getPhantomProvider();
        if (!provider) return;

        this.bindPhantomEvents(provider);
        try {
            const response = await provider.connect({ onlyIfTrusted: true });
            const address = response?.publicKey?.toString();
            if (address) {
                this.setState({ solanaWallet: address, phantomConnected: true }, () => {
                    this.refreshSolanaTestingData(address);
                });
            }
        } catch (error) {
            // Phantom rejects onlyIfTrusted when the user has not connected yet.
        }
    };

    connectPhantomWallet = async () => {
        const provider = this.getPhantomProvider();
        if (!provider) {
            EventBus.publish('info', 'Phantom wallet not found.');
            return;
        }

        try {
            this.bindPhantomEvents(provider);
            const response = await provider.connect();
            const address = response?.publicKey?.toString();
            if (!address) return;

            this.setState({ solanaWallet: address, phantomConnected: true }, () => {
                this.refreshSolanaTestingData(address);
            });
            EventBus.publish('info', 'Phantom wallet connected!');
        } catch (error) {
            console.error('Phantom connection error:', error);
            EventBus.publish('error', error?.message || 'Unable to connect Phantom wallet.');
        }
    };

    connectEthereumWallet = async () => {
        try {
            const provider = getInjectedEthereumProvider();
            const netId = await switchToConfiguredEvmNetwork(provider);
            const accounts = await requestEthereumAccounts(provider);
            const address = accounts[0];

            if (provider.on) {
                provider.on('accountsChanged', () => {
                    window.location.reload();
                });
                provider.on('chainChanged', () => {
                    window.location.reload();
                });
            }

            this.props.connectWalletSuccess({
                address,
                network: netId,
                provider,
            });

            localStorage.setItem('connectWalletSuccess', JSON.stringify({
                address,
                network: netId,
                providerType: 'injected'
            }));

            this.setState({ evmNetworkId: netId });
            this.loadUserData(address);
            EventBus.publish('info', 'Ethereum wallet connected!');
        } catch (error) {
            console.error('Ethereum connection error:', error);
            if (error?.code === 4001) {
                EventBus.publish('info', 'Wallet connection rejected.');
            } else {
                EventBus.publish('error', error?.message || 'Unable to connect Ethereum wallet.');
            }
        }
    };

    switchLocalEvmNetwork = async () => {
        try {
            const netId = await switchToConfiguredEvmNetwork();
            this.setState({ evmNetworkId: netId });
            EventBus.publish('info', 'Hardhat network ready.');
        } catch (error) {
            console.error('EVM network switch error:', error);
            EventBus.publish('error', error?.message || 'Unable to switch EVM network.');
        }
    };

    fetchSolanaRpc = async (method, params = []) => {
        const response = await fetch(localSolanaRpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method,
                params,
            }),
        });

        const data = await this.parseJsonResponse(response, 'Local Solana RPC returned non-JSON');
        if (data.error) {
            throw new Error(data.error.message);
        }
        return data.result;
    };

    fetchCoreAssets = async (walletAddress) => {
        const query = localBridgeNftAddress
            ? `?contractAddress=${encodeURIComponent(localBridgeNftAddress)}`
            : '';
        const response = await fetch(`${ApiUrl}/bridge/coreAssets/${walletAddress}${query}`);
        const data = await this.parseJsonResponse(response, 'Bridge API returned non-JSON');

        if (!response.ok || data?.code >= 400) {
            throw new Error(data?.message || 'Unable to read Core assets.');
        }

        return data?.body || [];
    };

    refreshSolanaTestingData = async (walletAddress = this.state.solanaWallet) => {
        if (!isLocalBridgeTesting || !walletAddress) return;

        this.setState({
            solanaBalanceLoading: true,
            solanaAssetsLoading: true,
            coreAssetsLoading: true,
            solanaRpcError: '',
        });

        try {
            const [balanceResult, accountsResult] = await Promise.all([
                this.fetchSolanaRpc('getBalance', [walletAddress]),
                this.fetchSolanaRpc('getTokenAccountsByOwner', [
                    walletAddress,
                    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
                    { encoding: 'jsonParsed' },
                ]),
            ]);
            let coreAssets = [];
            let coreAssetsError = '';

            try {
                coreAssets = await this.fetchCoreAssets(walletAddress);
            } catch (error) {
                coreAssetsError = error?.message || 'Unable to read Core assets.';
            }

            const solanaAssets = (accountsResult?.value || [])
                .map((account) => {
                    const info = account.account?.data?.parsed?.info;
                    const tokenAmount = info?.tokenAmount || {};
                    return {
                        account: account.pubkey,
                        mint: info?.mint,
                        amount: tokenAmount.uiAmountString || tokenAmount.amount,
                        decimals: tokenAmount.decimals,
                    };
                })
                .filter((asset) => asset.mint && asset.amount === '1' && asset.decimals === 0);

            this.setState({
                solanaBalance: balanceResult?.value / 1000000000,
                solanaAssets,
                coreAssets,
                solanaRpcError: coreAssetsError,
                solanaBalanceLoading: false,
                solanaAssetsLoading: false,
                coreAssetsLoading: false,
            });
        } catch (error) {
            console.error('Local Solana RPC error:', error);
            this.setState({
                solanaRpcError: error?.message || 'Unable to read local Solana RPC.',
                solanaBalanceLoading: false,
                solanaAssetsLoading: false,
                coreAssetsLoading: false,
            });
        }
    };

    handleContractBurn = async (walletAddress, contractAddress, tokenId) => {
        this.setState({ isLoading: true });
        try {
            const provider = getInjectedEthereumProvider();
            await switchToConfiguredEvmNetwork(provider);
            const evmWeb3 = new Web3(provider);
            const nftContract = new evmWeb3.eth.Contract(BurnAbi, contractAddress);
            const baseGasPrice = await evmWeb3.eth.getGasPrice();
            const gasPrice = Math.floor(Number(baseGasPrice) * 2);
            const tx = await nftContract.methods.safeTransferFrom(walletAddress, BRIDGE_BURN_ADDRESS, tokenId)
                .send({ from: walletAddress, gas: 300000, gasPrice: gasPrice })


            return tx.transactionHash
        } catch (error) {
            console.log(error)
            this.setState({ isLoading: false });
        }
    }

    getNormalizedTokenId = (tokenId) => {
        const value = String(tokenId || '').trim();
        return value.toLowerCase().startsWith('0x') ? Web3.utils.hexToNumberString(value) : value;
    }

    getBridgeAuthorizationMessage = ({ ethWallet, solanaWallet, contractAddress, tokenId }) => ([
        'Modern Poker Club NFT Bridge Authorization',
        '',
        'I authorize Modern Poker Club to mint the matching Solana NFT to this Solana wallet after this Ethereum NFT is burned.',
        `Ethereum wallet: ${String(ethWallet || '').toLowerCase()}`,
        `Solana wallet: ${String(solanaWallet || '').trim()}`,
        `NFT contract: ${String(contractAddress || '').toLowerCase()}`,
        `Token ID: ${this.getNormalizedTokenId(tokenId)}`,
        `Burn address: ${BRIDGE_BURN_ADDRESS}`,
    ].join('\n'))

    signBridgeAuthorization = async ({ ethWallet, solanaWallet, contractAddress, tokenId }) => {
        const provider = getInjectedEthereumProvider();
        await switchToConfiguredEvmNetwork(provider);
        const bridgeAuthorizationMessage = this.getBridgeAuthorizationMessage({
            ethWallet,
            solanaWallet,
            contractAddress,
            tokenId,
        });
        const bridgeAuthorizationSignature = await provider.request({
            method: 'personal_sign',
            params: [bridgeAuthorizationMessage, ethWallet],
        });

        return {
            bridgeAuthorizationMessage,
            bridgeAuthorizationSignature,
        };
    }

    handleBurnNft = async (tokenId, contractAddress, name, symbol, image) => {
        const { publicAddress } = this.props;
        const solanaWallet = this.state.solanaWallet || '';

        this.setState({ burnNftRecord: { tokenId, contractAddress } });
        this.setState({ isLoading: true });
        if (!publicAddress) {
            EventBus.publish('info', "Please connect your wallet first.");
            this.setState({ isLoading: false });
            return;
        }

        if (!solanaWallet) {
            EventBus.publish('info', 'Please add Solana wallet address.');
            this.setState({ isLoading: false });
            return;
        }

        try {
            const authorization = await this.signBridgeAuthorization({
                ethWallet: publicAddress,
                solanaWallet,
                contractAddress,
                tokenId,
            });
            // Step 1: Create burn record
            let data = {
                nftName: name,
                nftSymbol: symbol,
                image,
                nftContractAddress: contractAddress,
                nftTokenId: this.getNormalizedTokenId(tokenId),
                EtherumWallet: publicAddress,
                SolanaWallet: solanaWallet,
                status: 'pending',
                completedAt: null,
                ...authorization,
            }
            this.setState({ isLoading: true });
            await this.props.createBurnNftRecord(data);
            this.setState({ isLoading: false });
        } catch (error) {
            console.error("Error during burn process:", error);
            EventBus.publish('error', 'Failed to burn NFT. Please try again.');
            this.setState({ isLoading: false });
        }
    };

    handleRetryMint = (record) => {
        if (!record?.nftTokenId || !record?.nftContractAddress || !record?.EtherumWallet || !record?.transactionHashEtherum) {
            EventBus.publish('error', 'This bridge record is missing the burn transaction data needed to retry.');
            return;
        }

        this.props.mintNewNft({
            tokenId: record.nftTokenId,
            contractAddress: record.nftContractAddress,
            EtherumWallet: record.EtherumWallet,
            transactionHashEtherum: record.transactionHashEtherum,
            status: 'burned',
        });
    };

    renderLocalBridgeTestingPanel = () => {
        if (!isLocalBridgeTesting) return null;

        const {
            solanaWallet,
            solanaBalance,
            solanaAssets,
            coreAssets,
            solanaRpcError,
            solanaBalanceLoading,
            solanaAssetsLoading,
            coreAssetsLoading,
            phantomConnected,
        } = this.state;

        return (
            <div className="bridge-test-panel">
                <div className="bridge-test-grid">
                    <div className="bridge-test-item">
                        <span>EVM RPC</span>
                        <strong>{localBridgeRpcUrl}</strong>
                    </div>
                    <div className="bridge-test-item">
                        <span>Chain</span>
                        <strong>{localEvmChain.chainName} ({parseInt(localEvmChain.chainId, 16)})</strong>
                    </div>
                    <div className="bridge-test-item">
                        <span>NFT Contract</span>
                        <strong>{this.getShortAddress(localBridgeNftAddress) || 'Not set'}</strong>
                    </div>
                    <button className="bridge-test-btn" type="button" onClick={this.switchLocalEvmNetwork}>
                        Add / switch Hardhat
                    </button>
                    <div className="bridge-test-item">
                        <span>Solana RPC</span>
                        <strong>{localSolanaRpcUrl}</strong>
                    </div>
                    <div className="bridge-test-item">
                        <span>Phantom</span>
                        <strong>{phantomConnected ? this.getShortAddress(solanaWallet) : 'Not connected'}</strong>
                    </div>
                    <div className="bridge-test-item">
                        <span>Local SOL</span>
                        <strong>{solanaBalanceLoading ? 'Loading' : solanaBalance !== null ? `${solanaBalance} SOL` : '-'}</strong>
                    </div>
                    <button className="bridge-test-btn" type="button" onClick={() => this.refreshSolanaTestingData()}>
                        Refresh Solana
                    </button>
                </div>

                {solanaRpcError && <p className="bridge-test-error">{solanaRpcError}</p>}

                <div className="bridge-test-results">
                    <div className="bridge-test-result">
                        <h4>Local SPL Token Accounts</h4>
                        {solanaAssetsLoading ? (
                            <p>Loading local assets</p>
                        ) : solanaAssets.length > 0 ? (
                            solanaAssets.map((asset) => (
                                <a
                                    className="bridge-token-row bridge-token-link"
                                    href={this.getSolanaExplorerUrl('address', asset.mint)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    key={asset.account}
                                >
                                    <span>{this.getShortAddress(asset.mint)}</span>
                                    <strong>{asset.amount}</strong>
                                </a>
                            ))
                        ) : (
                            <p>No SPL token accounts found</p>
                        )}
                    </div>
                    <div className="bridge-test-result">
                        <h4>Core Assets in Wallet</h4>
                        {coreAssetsLoading ? (
                            <p>Loading Core assets</p>
                        ) : coreAssets.length > 0 ? (
                            coreAssets.map((asset) => (
                                <a
                                    className="bridge-core-row bridge-token-link"
                                    href={this.getSolanaExplorerUrl('address', asset.assetAddress)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    key={`${asset.nftTokenId}-${asset.assetAddress}`}
                                >
                                    <span className="bridge-core-thumb-wrap">
                                        {asset.image && (
                                            <img
                                                className="bridge-core-thumb"
                                                src={this.getNftImageSrc(asset.image, asset.nftTokenId || asset.name)}
                                                data-gateway-index="0"
                                                onError={(event) => this.handleImageError(
                                                    event,
                                                    asset.image
                                                )}
                                                alt={asset.name || 'Core asset'}
                                            />
                                        )}
                                    </span>
                                    <span className="bridge-core-copy">
                                        <span className="bridge-core-name">{asset.name || asset.sourceNftName || `NFT #${asset.nftTokenId}`}</span>
                                        <small>Owner: {this.getShortAddress(asset.owner)}</small>
                                        <small>URI: {asset.uri || asset.solanaMetadataUri}</small>
                                        {asset.metadata?.description && (
                                            <small className="bridge-core-description">{asset.metadata.description}</small>
                                        )}
                                        {asset.attributes?.length > 0 && (
                                            <span className="bridge-core-traits">
                                                {asset.attributes.slice(0, 6).map((trait) => (
                                                    <em key={`${asset.assetAddress}-${trait.trait_type}-${trait.value}`}>
                                                        {trait.trait_type}: {trait.value}
                                                    </em>
                                                ))}
                                            </span>
                                        )}
                                    </span>
                                    <strong>{this.getShortAddress(asset.assetAddress)}</strong>
                                </a>
                            ))
                        ) : (
                            <p>No Core assets found for this wallet</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    render() {
        let { sticky, publicAddress, burnHistory, nftMetadata } = this.props;
        const burnHistoryList = Array.isArray(burnHistory) ? burnHistory : [];
        const nftMetadataList = Array.isArray(nftMetadata) ? nftMetadata : [];

        return (
            <div className="mp-club-page" onWheel={this.onScroll}>
                {this.state.isLoading && (<Loader />)}
                <Navbar sticky={sticky} />
                <div className="bridge-modals">
                    <div className="auto-container">
                        <div className="row">
                            <div className="col-12">
                                <div className='content-area bridge-content-area'>
                                    <div className="top-area">
                                        <div className="sec-title text-center">
                                            <h2><img src={require('../../static/images/new-landing/bridge-title.png')} alt='' /></h2>
                                        </div>
                                    </div>
                                    <div className="bridge-section">

                                        <div className="wallet-to-sec">
                                            <div className="wallet-left">
                                                <div className="wallet-inner">
                                                    <div className="wallet-logo">
                                                        <i><img src={require('../../static/images/new-landing/eth-icon.png')} alt='' /></i>
                                                        ethereum
                                                    </div>
                                                    <button className="wallet-connect-btn" type="button" onClick={this.connectEthereumWallet}>
                                                        {publicAddress ? this.getShortAddress(publicAddress) : 'Connect MetaMask'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="to-btn">
                                                <img src={require('../../static/images/new-landing/to-btn.png')} alt='' />
                                            </div>
                                            <div className="wallet-left">
                                                <div className="wallet-inner">
                                                    <div className="wallet-logo">
                                                        <i><img src={require('../../static/images/new-landing/solana-icon.png')} alt='' /></i>
                                                        solana
                                                    </div>
                                                    <input type="text" onChange={(e) => this.setState({ solanaWallet: e.target.value })} placeholder="Connect Phantom or paste address" value={this.state.solanaWallet} />
                                                    <button className="wallet-connect-btn solana-connect-btn" type="button" onClick={this.connectPhantomWallet}>
                                                        {this.state.phantomConnected ? this.getShortAddress(this.state.solanaWallet) : 'Connect Phantom'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {this.renderLocalBridgeTestingPanel()}
                                        <div className="nft-selection-area">
                                            <div className="nft-inner-area">
                                                {nftMetadataList.length === 0 ? (
                                                    <p>No NFT found in your wallet</p>
                                                ) : (
                                                    nftMetadataList.map((nft, index) => (
                                                        <div className="nft-box" key={index}>
                                                            <span className="bridge-nft-image-wrap">
                                                                {nft.imageUrl && (
                                                                    <img
                                                                        src={this.getNftImageSrc(nft.imageUrl, nft.tokenId || nft.name)}
                                                                        data-gateway-index="0"
                                                                        onError={(event) => this.handleImageError(
                                                                            event,
                                                                            nft.imageUrl
                                                                        )}
                                                                        alt={nft.name || ''}
                                                                    />
                                                                )}
                                                            </span>
                                                            {/* <p>{nft.imageUrl}</p> */}
                                                            <div className="burn-area">
                                                                <span className="number-id">#{nft.tokenId || nft.name?.match(/\d+/g)?.pop()}</span>
                                                                <button
                                                                    onClick={() => this.handleBurnNft(nft.tokenId, nft.contract, nft.name, nft.symbol, nft.imageUrl)}
                                                                    className="burn-btn"
                                                                    type="button"
                                                                    disabled={nft.metadataReady === false}
                                                                    title={nft.metadataReady === false ? 'Replacement metadata is not available for this token.' : ''}
                                                                >
                                                                    <span>burn</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                    <div className="history-sec">
                                        <h2>History</h2>
                                        <div className="bottom-data-area">
                                            <div className="table-responsive">
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th scope="col">NFT</th>
                                                            <th scope="col">ID</th>
                                                            <th scope="col">Ethereum</th>
                                                            <th scope="col">Solana</th>
                                                            <th scope="col">Date</th>
                                                            <th scope="col">Status</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {burnHistoryList.length > 0 ? (
                                                            burnHistoryList.map((item, index) => {
                                                                const tokenId = String(item?.nftTokenId || '');
                                                                const ethTx = String(item?.transactionHashEtherum || '');
                                                                return (
                                                                <tr key={item?._id || `${tokenId}-${index}`}>
                                                                    <th scope="row">
                                                                        <div className="nft-box">
                                                                            {item?.image && (
                                                                                <img
                                                                                    src={this.getNftImageSrc(item.image, tokenId || item.nftName)}
                                                                                    data-gateway-index="0"
                                                                                    onError={(event) => this.handleImageError(event, item.image)}
                                                                                    alt=''
                                                                                />
                                                                            )}
                                                                            <span className="name">{item?.nftName || 'MPC NFT'}</span>
                                                                        </div>
                                                                    </th>
                                                                    <td>
                                                                        {tokenId &&
                                                                            <div className="text-box">
                                                                                #{tokenId.substring(0, 3)}...{tokenId.substring(tokenId.length - 3)}
                                                                                <div className="overlabox">
                                                                                    #{tokenId}
                                                                                </div>

                                                                            </div>
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {ethTx
                                                                            ? <a href={`${explorer}/tx/${ethTx}`} target="_blank" rel="noopener noreferrer">
                                                                                <div className="text-box">
                                                                                    <i>
                                                                                        <img src={require('../../static/images/new-landing/eth-icon.png')} alt='' />
                                                                                    </i>
                                                                                    {ethTx.substring(0, 3)}...{ethTx.substring(ethTx.length - 3)}

                                                                                    <>
                                                                                        <div className="overlabox">
                                                                                            {ethTx}
                                                                                        </div>
                                                                                        <i className="icon-arow">
                                                                                            <svg fill="#ffffff80" height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330.002 330.002">
                                                                                                <path id="XMLID_103_" d="M233.252,155.997L120.752,6.001c-4.972-6.628-14.372-7.97-21-3c-6.628,4.971-7.971,14.373-3,21
                                                                                        l105.75,140.997L96.752,306.001c-4.971,6.627-3.627,16.03,3,21c2.698,2.024,5.856,3.001,8.988,3.001
                                                                                        c4.561,0,9.065-2.072,12.012-6.001l112.5-150.004C237.252,168.664,237.252,161.33,233.252,155.997z"/>
                                                                                            </svg>
                                                                                        </i>
                                                                                    </>
                                                                                </div>
                                                                            </a>
                                                                            : <div className="text-box">
                                                                                Wallet address empty
                                                                            </div>
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {(() => {
                                                                            const solanaNftAddress = item?.nftTokenIdSolana;
                                                                            const solanaTxHash = item?.transactionHashSolana;
                                                                            const solanaValue = solanaNftAddress || solanaTxHash;
                                                                            const solanaPath = solanaNftAddress ? 'address' : 'tx';

                                                                            return solanaValue?.substring(0)
                                                                                ? <a href={this.getSolanaExplorerUrl(solanaPath, solanaValue)} target="_blank" rel="noopener noreferrer">
                                                                                    <div className="text-box">
                                                                                        <i>
                                                                                            <img src={require('../../static/images/new-landing/solana-icon.png')} alt='' />
                                                                                        </i>
                                                                                        {solanaValue.substring(0, 3)}...{solanaValue.substring(solanaValue.length - 3)}
                                                                                        <div className="overlabox">
                                                                                            {solanaNftAddress ? 'Core asset: ' : 'Transaction: '}
                                                                                            {solanaValue}
                                                                                        </div>
                                                                                        <i className="icon-arow">
                                                                                            <svg fill="#ffffff80" height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330.002 330.002">
                                                                                                <path id="XMLID_103_" d="M233.252,155.997L120.752,6.001c-4.972-6.628-14.372-7.97-21-3c-6.628,4.971-7.971,14.373-3,21
                                                                                        l105.75,140.997L96.752,306.001c-4.971,6.627-3.627,16.03,3,21c2.698,2.024,5.856,3.001,8.988,3.001
                                                                                        c4.561,0,9.065-2.072,12.012-6.001l112.5-150.004C237.252,168.664,237.252,161.33,233.252,155.997z"/>
                                                                                            </svg>
                                                                                        </i>
                                                                                    </div>
                                                                                </a>
                                                                                : <div className="text-box">
                                                                                    Wallet address empty
                                                                                </div>
                                                                        })()}
                                                                    </td>
                                                                    <td>
                                                                        <div className="text-box">
                                                                            {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="text-box">
                                                                            {item?.status || '-'}
                                                                        </div>
                                                                        {item?.status === 'failed' && item?.transactionHashEtherum && (
                                                                            <button
                                                                                className="burn-btn"
                                                                                type="button"
                                                                                onClick={() => this.handleRetryMint(item)}
                                                                            >
                                                                                <span>retry mint</span>
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                                );
                                                            })
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'white' }}>
                                                                    No records found
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>

                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div >
        );
    }
}

const mapDispatchToProps = {
    setBurnNftRecord, createBurnNftRecord, mintNewNft, setMintedNft, getBurnNftHistory, getWalletNft, setWalletNft, connectWalletSuccess
};

const mapStateToProps = ({ Auth }) => {
    let { address, isBurnNftRecord, nftMinted, burnHistory, nftMetadata } = Auth;
    return { isBurnNftRecord, publicAddress: address, nftMinted, burnHistory, nftMetadata };
};

export default connect(mapStateToProps, mapDispatchToProps)(Bridge);
