import React, { useEffect, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from '@material-ui/core/Button';
import { ValidatorForm } from '../../components/FormValidator';
import logo from '../../assets/img/mpc-logo.png';
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
    <main className="login-page">
      <section className="login-shell" aria-labelledby="admin-login-title">
        <div className="login-brand-panel">
          <img className="login-page-logo" src={logo} alt="Modern Poker Club" />
          <div className="login-brand-copy">
            <span className="login-eyebrow">Official operations portal</span>
            <h1>Modern Poker Club</h1>
            <p>One secure console for player, game, treasury and economy operations.</p>
          </div>
          <div className="login-authenticity-mark">
            <i className="tim-icons icon-lock-circle" aria-hidden="true" />
            <span><strong>Verify before signing</strong><small>Only approve the ModernPokerClub wallet message.</small></span>
          </div>
        </div>

        <div className="login-area">
          <div className="login-form">
            <span className="login-eyebrow">Administrator access</span>
            <h2 className="login-title" id="admin-login-title">Welcome back</h2>
            <p className="login-intro">Connect the approved Phantom wallet to enter the admin console.</p>
            {false
              ? <div className="login-text pt-4"><h4>{message}</h4></div>
              : <Fragment>
                <ValidatorForm className="validator-form" onSubmit={Nonce}>
                  <Button type="submit" variant="contained" className="login-btn" disabled={isLogin}>
                    {!isLogin
                      ? <><i className="tim-icons icon-wallet-43" aria-hidden="true" /> Connect approved wallet</>
                      : <><i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Verifying signature</>
                    }
                  </Button>
                </ValidatorForm>
              </Fragment>
            }
            <div className="login-security-points" aria-label="Authentication safeguards">
              <span><i className="tim-icons icon-check-2" /> Wallet signature</span>
              <span><i className="tim-icons icon-check-2" /> Role verification</span>
              <span><i className="tim-icons icon-check-2" /> Audited session</span>
            </div>
            <small className="login-support-copy">Authorized administrators only. Never approve an unexpected wallet prompt.</small>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
