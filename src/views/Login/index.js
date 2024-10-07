import React, { useEffect, useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from '@material-ui/core/Button';
import { ValidatorForm } from 'react-material-ui-form-validator';
import logo from '../../assets/img/logo.png';
import EventBus from 'eventing-bus';
import { message } from "../../store/config";
import { login, toggleLogin, getNonce, setNonce } from "../../store/actions/Auth";
import './index.css';

const Login = ({ history }) => {
  // const [address, setAddress] = useState('');
  const dispatch = useDispatch();
  const isLogin = useSelector(state => state.Auth.isLogin);
  const userNonce = useSelector(state => state.Auth.userNonce);

  useEffect(() => {
    dispatch(setNonce(""));
  }, []);

  useEffect(() => {
    if (userNonce !== '') handleLogin(userNonce);
  }, [userNonce]);

  const Nonce = async () => {
    if (!window.solana) {
      EventBus.publish("error", "Please install Phantom Wallet");
      return;
    }

    const response = await window.solana.connect();
    const address = response.publicKey.toString();

    dispatch(toggleLogin(true));
    dispatch(getNonce({ data: address }));

    if (userNonce !== '') handleLogin(userNonce);
  };

  const handleLogin = async (nonce) => {
    if (!window.solana || !window.solana.isPhantom) {
      EventBus.publish("error", "Please install Phantom Wallet");
      return;
    }

    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toString();

      const message = `ModernPokerClub,${nonce}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await window.solana.signMessage(encodedMessage, 'utf8');

      const data = {
        publicAddress: address,
        signature: signature.signature,
      };

      dispatch(login({ data, history }));

    } catch (err) {
      dispatch(toggleLogin(false));
      EventBus.publish("error", "Login failed, please try again");
    }
  };

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
                <ValidatorForm className="validator-form mt-4" onSubmit={Nonce}>
                  <Button type="Submit" variant="contained" className='text-white login-btn mt-4' disabled={isLogin}>
                    {!isLogin
                      ? 'LOGIN WITH PHANTOM'
                      : <i className="fa-solid fa-spinner fa-spin fa-xl"></i>
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
    </div>
  );
};

export default Login;