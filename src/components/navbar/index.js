import EventBus from "eventing-bus";
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import React, { Component } from 'react';
import { HashLink } from 'react-router-hash-link';

import './index.css';
import { login } from '../../store/actions/Auth';
import { connectWalletSuccess, disconnectWallet } from '../../store/actions/Auth.js';
import { configuredNetworkMessage, getCurrentEvmNetworkId, getInjectedEthereumProvider, requestEthereumAccounts, switchToConfiguredEvmNetwork } from '../../store/walletNetworks';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      error: null,
      showWalletDropdown: false,
    };
  }

  async componentDidMount() {
    try {
      if (window.ethereum) {

        const provider = getInjectedEthereumProvider();
        this.bindEthereumEvents(provider);

        const accounts = await provider.request({ method: 'eth_accounts' });
        if (provider && accounts.length > 0) {
          const network = await getCurrentEvmNetworkId(provider);
          this.syncWalletConnection(accounts[0], network, provider);
        } else {
          this.props.disconnectWallet();
          localStorage.removeItem('connectWalletSuccess');
        }
      }
    } catch (e) {
      this.props.disconnectWallet();
      localStorage.removeItem('connectWalletSuccess');
    }

  }

  componentWillUnmount() {
    if (this.ethereumProvider?.removeListener) {
      this.ethereumProvider.removeListener('accountsChanged', this.handleAccountsChanged);
      this.ethereumProvider.removeListener('chainChanged', this.handleChainChanged);
    }
  }

  syncWalletConnection = (address, network, provider) => {
    if (!address) return;

    this.props.connectWalletSuccess({
      address,
      network,
      provider,
    });

    localStorage.setItem('connectWalletSuccess', JSON.stringify({
      address,
      network,
      providerType: 'injected'
    }));
  };

  handleAccountsChanged = async (accounts = []) => {
    const provider = getInjectedEthereumProvider();
    const address = accounts[0];

    if (!address) {
      this.disconnect();
      return;
    }

    const network = await getCurrentEvmNetworkId(provider);
    this.syncWalletConnection(address, network, provider);
  };

  handleChainChanged = async () => {
    const provider = getInjectedEthereumProvider();
    const accounts = await provider.request({ method: 'eth_accounts' });
    if (accounts.length === 0) return;

    const network = await getCurrentEvmNetworkId(provider);
    this.syncWalletConnection(accounts[0], network, provider);
  };

  bindEthereumEvents = (provider) => {
    if (!provider || this.ethereumProvider === provider) return;

    this.ethereumProvider = provider;
    if (provider.on) {
      provider.on('accountsChanged', this.handleAccountsChanged);
      provider.on('chainChanged', this.handleChainChanged);
    }
  };

  connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        EventBus.publish('info', 'MetaMask not found. Please install MetaMask!');
        return;
      }

      const provider = getInjectedEthereumProvider();
      this.bindEthereumEvents(provider);
      const netId = await switchToConfiguredEvmNetwork(provider);

      if (!netId) {
        EventBus.publish('info', configuredNetworkMessage);
      }

      const accounts = await requestEthereumAccounts(provider);
      const address = accounts[0];

      this.syncWalletConnection(address, netId, provider);

      EventBus.publish('info', 'Wallet connected!');
    } catch (error) {
      console.error("Wallet connection error:", error);
      if (error?.code === 4001) {
        EventBus.publish('info', 'Wallet connection rejected.');
      } else {
        EventBus.publish('error', error?.message || 'Wallet connection failed.');
      }
      this.setState({ error: error.message });
    }
  };

  disconnect = () => {
    this.props.disconnectWallet();
    localStorage.removeItem('connectWalletSuccess');
    EventBus.publish('info', 'Wallet disconnected');
    this.setState({ showWalletDropdown: false });
  }

  toggleWalletDropdown = () => {
    this.setState((prevState) => ({
      showWalletDropdown: !prevState.showWalletDropdown
    }));
  };

  render() {
    const { sticky, publicAddress } = this.props;

    return (
      <div className={`mp-club-nav ${sticky ? 'sticky-nav' : ''}`}>
        <nav className='navbar navbar-expand-lg sidenav' id="sidenav-1" data-mdb-hidden="false">
          <div className='container-fluid'>
            <div className="inner-container">
              <HashLink className='navbar-brand' smooth to='/#home'>
                <img src={require('../../static/images/new-landing/logo-banner.png')} alt='Modern Poker Club' />
              </HashLink>
              <button onClick={() => this.setState(prev => ({ isOpen: !prev.isOpen }))} className='navbar-toggler' type='button'>
                <i className='fa fa-bars' aria-hidden='true'></i>
              </button>
              <div className={`collapse navbar-collapse nav-links ${this.state.isOpen ? 'show' : ''}`} id='navbarSupportedContent'>
                <ul className='navbar-nav sidenav-menu'>
                  <li className='nav-item'>
                    <HashLink className='nav-link' smooth to='/#home'>Home</HashLink>
                  </li>
                  <li className='nav-item'>
                    <a className='nav-link' href='https://tony-update.d3fd413nat6wcy.amplifyapp.com/' target="_blank" rel="noopener noreferrer">Start Playing</a>
                  </li>
                  <li className='nav-item'>
                    <Link className='nav-link' to="/bridge">NFT Migration</Link>
                  </li>
                  <li className='nav-item'>
                    <HashLink className='nav-link' smooth to='/#marketplace'>Marketplace</HashLink>
                  </li>
                  <li className='nav-item'>
                    <HashLink className='nav-link' smooth to='/#faq'>FAQ</HashLink>
                  </li>
                </ul>

                {
                  publicAddress ?
                    <>
                      <div className="wallet-dropdown">
                        <button
                          className="nav-btn btn-style-one desktop-btn"
                          type="button"
                          onClick={this.toggleWalletDropdown}
                        >
                          <span>{publicAddress.substring(0, 5) + '.....' + publicAddress.slice(-4)}</span>
                          {this.state.showWalletDropdown || (
                            <i className="icon">
                              <svg fill="#764503" height="800px" width="800px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330">
                                <path id="XMLID_225_" d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393
                              c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393
                              s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"/>
                              </svg>
                            </i>
                          )}
                        </button>

                        {this.state.showWalletDropdown && (
                          <div className="wallet-menu">
                            <button onClick={this.disconnect}>Disconnect</button>
                          </div>
                        )}
                      </div>
                    </>
                    :
                    <button onClick={this.connectWallet} className="nav-btn btn-style-one desktop-btn" type="button">
                      <span>Connect Wallet</span>
                    </button>
                }

              </div>
            </div>
          </div>
        </nav>
      </div >
    );
  }
}

const mapStateToProps = ({ Auth }) => {
  let { address } = Auth;
  return { publicAddress: address };
};

const mapDispatchToProps = {
  connectWalletSuccess,
  disconnectWallet,
  login
};

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);
