import EventBus from "eventing-bus";
import { connect } from 'react-redux';
import React, { Component } from 'react';
import Error from '@material-ui/icons/Error';
import { createBrowserHistory } from "history";
import { ToastContainer, toast } from 'react-toastify';
import CheckCircle from '@material-ui/icons/CheckCircle';
import { Router, Switch, Route } from "react-router-dom";

import About from './About';
import Bridge from './Bridge';
import MPokerClub from './MPokerClub';
import Loader from '../components/loader';
import PrivacyPolicy from './PrivacyPolicy';
import RiskDisclaimer from './RiskDisclaimer';
import TermsandConditions from './TermsandConditions';
import CustomerAcceptancePolicy from './CustomerAcceptancePolicy';
import ResponsibleSocialGameplayPolicy from './ResponsibleSocialGameplayPolicy';

import { logout, login } from '../store/actions/Auth';

import '../static/css/style.css';

import 'jquery/dist/jquery.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import "react-toastify/dist/ReactToastify.css";

const hist = createBrowserHistory();
class App extends Component {

  constructor(props) {
    super(props);
    this.state = {}
  };

  componentDidMount() {
    EventBus.on('tokenExpired', () => this.props.logout());
    EventBus.on('info', (e) => toast.info(() => <div> <Error /> {e}</div>));
    EventBus.on('error', (e) => toast.error(() => <div> <Error /> {e}</div>));
    EventBus.on('success', (e) => toast.success(() => <div> <CheckCircle /> {e}</div>));
  };


 

  render() {

    return (
      <div>
        <Loader />
        <ToastContainer
          closeOnClick
          position="bottom-left"
        />

        <Router history={hist}>
          <Switch>
            <Route exact path='/' component={props => <MPokerClub {...props} />} />
            <Route exact path='/About' component={props => <About {...props} />} />
            <Route exact path='/Bridge' component={props => <Bridge {...props} />} />
            <Route exact path='/MPokerClub' component={props => <MPokerClub {...props} />} />
            <Route exact path='/privacy-policy' component={props => <PrivacyPolicy {...props} />} />
            <Route exact path='/terms-and-conditions' component={props => <TermsandConditions {...props} />} />
            <Route exact path='/responsible-social-gameplay-policy' component={props => <ResponsibleSocialGameplayPolicy {...props} />} />
            <Route exact path='/customer-acceptance-policy' component={props => <CustomerAcceptancePolicy {...props} />} />
            <Route exact path='/risk-disclaimer' component={props => <RiskDisclaimer {...props} />} />
          </Switch>
        </Router>

      </div>
    );
  }
}

const mapDispatchToProps = {
  logout, login
};

const mapStateToProps = ({ Auth }) => {
  let { publicAddress } = Auth;
  return { publicAddress }
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
