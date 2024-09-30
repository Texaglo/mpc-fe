import EventBus from 'eventing-bus';
import { connect } from "react-redux";
import React, { Component } from 'react'
import { createBrowserHistory } from "history";
import { ToastContainer, toast } from 'react-toastify';
import { HashRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import Login from "./views/Login/index.js";
import Admin from "./layouts/Admin.jsx";
import PrivateRoute from './store/PrivateRoute';
import { logout } from './store/actions/Auth';
import { networkId, message } from "./store/config";

import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const hist = createBrowserHistory();

export class App extends React.Component {

  async componentDidMount() {
    console.log("**************Hello I'm HERE");

    EventBus.on('info', (e) => toast.info(e));
    EventBus.on('error', (e) => toast.error(e));
    EventBus.on('success', (e) => toast.success(e, {
      style: {
        backgroundColor: '#4CAF50',
        color: '#FFFFFF'
      }
    }));
    EventBus.on("tokenExpired", () => this.props.logout());
    this.handleWalletChanges();
  };

  // handleWalletChanges = () => {
  //   let { auth } = this.props;
  //   if (!window.ethereum) {
  //     EventBus.publish("error", "Please install metamask extension!");
  //     return;
  //   };
  //   if (typeof window.ethereum !== "undefined") {
  //     // check network
  //     web3.eth.net.getId((err, netId) => {
  //       if (netId != networkId) EventBus.publish('info', message);
  //     });

  //     // if (window.ethereum.currentProvider.isMetaMask) {
  //     window.ethereum.on("accountsChanged", accounts => {
  //       this.props.logout();
  //       if (!auth || auth == '' || auth == null || auth == undefined) window.location.reload();
  //       EventBus.publish("info", "Account has been changed");
  //     });

  //     window.ethereum.on("networkChanged", netId => {
  //       if (netId != networkId) {
  //         this.props.logout();
  //         window.location.reload();
  //         EventBus.publish("info", "Network has been changed");
  //       }
  //     });
  //   }
  // };

  handleWalletChanges = async () => {
    let { auth } = this.props;
    if (!window.solana || !window.solana.isPhantom) {
      EventBus.publish('error', `Please Install Phantom Wallet!!!`);
      return;
    }

    try {
      console.log("**************Hello I'm HERE");
      await window.solana.connect();
      // Add an event listener to detect account changes
      window.solana.on('accountChanged', (newPublicKey) => {
        if (newPublicKey) {
          this.props.logout();
          if (!auth || auth == '' || auth == null || auth == undefined) window.location.reload();
          EventBus.publish("info", "Account has been changed");
        } else {
          this.props.logout();
          this.handleWalletChanges()
        }
      });

    } catch (err) {
      console.error('Connection to Phantom failed:', err);
    }
  };

  render() {
    return (
      <div>
        <ToastContainer />
        <Router history={hist}>
          <Switch>
            <Route path="/login" render={props => <Login {...props} />} />
            <PrivateRoute path="/home" component={props => <Admin {...props} />} />
            <Redirect from="/" to="/login" />
          </Switch>
        </Router>
      </div>
    )
  }
}
const mapDispatchToProps = { logout };

const mapStateToProps = ({ Auth }) => {
  let { auth } = Auth
  return { auth }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
