import EventBus from 'eventing-bus';
import { connect } from "react-redux";
import Button from '@material-ui/core/Button';
import React, { Fragment } from "react";
import { ValidatorForm } from 'react-material-ui-form-validator';
import logo from '../../assets/img/logo.png';
import { message } from "../../store/config";
import { login, toggleLogin, getNonce } from "../../store/actions/Auth";
import './index.css';

class Login extends React.Component {
  constructor() {
    super();
    this.state = {
      netId: '',
      address: ''
    };
  };


  async componentDidMount() {
    if (!window.solana) {
      EventBus.publish("error", "Please install Phantom Wallet");
      return;
    };
    this.checkAddresses();
  };

  componentWillReceiveProps() {
    this.checkAddresses();
  };

  componentDidUpdate(prevProps, prevState) {
    let { userNonce } = this.props;
    if (prevProps.userNonce !== userNonce) {
      this.handleLogin(userNonce)
    }
  };

  checkAddresses = async () => {
    const response = await window.solana.connect();
    let address = response.publicKey.toString();
    this.setState({ address });
  };

  getNonce = async () => {
    if (!window.solana) {
      EventBus.publish("error", "Please install Phantom Wallet");
      return;
    };

    let { address } = this.state;
    this.props.toggleLogin(true);

    this.props.getNonce({ data: address });
  };

  handleLogin = async (nonce) => {
    // Check if Phantom Wallet is installed
    if (!window.solana || !window.solana.isPhantom) {
      EventBus.publish("error", "Please install Phantom Wallet");
      return;
    }

    let { address } = this.state;
    let { history } = this.props;

    try {

      const response = await window.solana.connect();
      address = response.publicKey.toString();

      const message = `ModernPokerClub,${nonce}`;
      const encodedMessage = new TextEncoder().encode(message);

      const signature = await window.solana.signMessage(encodedMessage, 'utf8');

      const data = {
        publicAddress: address,
        signature: signature.signature,
      };

      this.props.toggleLogin(true);
      this.props.login({ data, history });

    } catch (err) {
      EventBus.publish("error", "Login failed, please try again");
    }
  };


  render() {
    let { netId } = this.state;
    let { isLogin } = this.props;

    return (
      <div className="login-page">
        <div className="row">
          <div className="col-lg-6 col-md-6 col-sm-12 login-area">
            <div className="login-form">
              <p className="login-title">🅻🅾🅶🅸🅽</p>
              <hr className='mt-3' />
              {false
                ? <div className="login-text pt-4"><h4>{message}</h4></div>
                : <Fragment>
                  <ValidatorForm className="validator-form mt-4" onSubmit={this.getNonce}>
                    <Button type="Submit" variant="contained" className='text-white login-btn mt-4' disabled={isLogin} >
                      {!isLogin
                        ? 'LOGIN WITH PHANTOM'
                        : <i className="fa fa-spinner fa-spin fa-fw"></i>
                      }
                    </Button>
                  </ValidatorForm>
                </Fragment>
              }
            </div>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 login-area">
            <img className="login-page-logo" src={logo} alt='logo' />
          </div>
        </div>
      </div >
    );
  }
}

const mapDispatchToProps = {
  login,
  getNonce,
  toggleLogin,
};

const mapStateToProps = ({ Auth }) => {
  let { isLogin, userNonce } = Auth
  return { isLogin, userNonce }
};
export default connect(mapStateToProps, mapDispatchToProps)(Login);