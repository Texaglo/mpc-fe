import React from 'react';
import home from '../../assets/img/admin-console/icons/home.svg';
import user from '../../assets/img/admin-console/icons/user.svg';
import users from '../../assets/img/admin-console/icons/users.svg';
import user_add from '../../assets/img/admin-console/icons/user-add.svg';
import controller from '../../assets/img/admin-console/icons/controller.svg';
import gamepad from '../../assets/img/admin-console/icons/gamepad.svg';
import wallet from '../../assets/img/admin-console/icons/wallet.svg';
import settings from '../../assets/img/admin-console/icons/settings.svg';
import clipboard from '../../assets/img/admin-console/icons/clipboard.svg';
import document from '../../assets/img/admin-console/icons/document.svg';
import coins from '../../assets/img/admin-console/icons/coins.svg';
import database from '../../assets/img/admin-console/icons/database.svg';
import coin from '../../assets/img/admin-console/icons/coin.svg';
import cash_bag from '../../assets/img/admin-console/icons/cash-bag.svg';
import chip from '../../assets/img/admin-console/icons/chip.svg';
import chip_spade from '../../assets/img/admin-console/icons/chip-spade.svg';
import bank from '../../assets/img/admin-console/icons/bank.svg';
import clock from '../../assets/img/admin-console/icons/clock.svg';
import shield from '../../assets/img/admin-console/icons/shield.svg';
import shield_check from '../../assets/img/admin-console/icons/shield-check.svg';
import shield_alert from '../../assets/img/admin-console/icons/shield-alert.svg';
import warning from '../../assets/img/admin-console/icons/warning.svg';
import chart from '../../assets/img/admin-console/icons/chart.svg';
import pie from '../../assets/img/admin-console/icons/pie.svg';
import table from '../../assets/img/admin-console/icons/table.svg';
import check from '../../assets/img/admin-console/icons/check.svg';
import check_solid from '../../assets/img/admin-console/icons/check-solid.svg';
import close from '../../assets/img/admin-console/icons/close.svg';
import ban from '../../assets/img/admin-console/icons/ban.svg';
import plus from '../../assets/img/admin-console/icons/plus.svg';
import plus_circle from '../../assets/img/admin-console/icons/plus-circle.svg';
import pause from '../../assets/img/admin-console/icons/pause.svg';
import tag from '../../assets/img/admin-console/icons/tag.svg';
import crown from '../../assets/img/admin-console/icons/crown.svg';
import trophy from '../../assets/img/admin-console/icons/trophy.svg';
import shirt from '../../assets/img/admin-console/icons/shirt.svg';
import bell from '../../assets/img/admin-console/icons/bell.svg';
import bolt from '../../assets/img/admin-console/icons/bolt.svg';
import info from '../../assets/img/admin-console/icons/info.svg';
import eye from '../../assets/img/admin-console/icons/eye.svg';
import link from '../../assets/img/admin-console/icons/link.svg';
import calendar from '../../assets/img/admin-console/icons/calendar.svg';
import search from '../../assets/img/admin-console/icons/search.svg';
import filter from '../../assets/img/admin-console/icons/filter.svg';
import download from '../../assets/img/admin-console/icons/download.svg';
import copy from '../../assets/img/admin-console/icons/copy.svg';
import external from '../../assets/img/admin-console/icons/external.svg';
import location from '../../assets/img/admin-console/icons/location.svg';
import mail from '../../assets/img/admin-console/icons/mail.svg';
import lock from '../../assets/img/admin-console/icons/lock.svg';
import key from '../../assets/img/admin-console/icons/key.svg';
import rocket from '../../assets/img/admin-console/icons/rocket.svg';
import receipt from '../../assets/img/admin-console/icons/receipt.svg';
import deposit from '../../assets/img/admin-console/icons/deposit.svg';
import withdrawal from '../../assets/img/admin-console/icons/withdrawal.svg';
import approved from '../../assets/img/admin-console/icons/approved.svg';
import solana from '../../assets/img/admin-console/brands/solana.svg';
import usdc from '../../assets/img/admin-console/brands/usdc.svg';
import google from '../../assets/img/admin-console/brands/google.png';
import apple from '../../assets/img/admin-console/brands/apple.svg';
import phantom from '../../assets/img/admin-console/brands/phantom.svg';
import './index.css';

const glyphs = {'home': home,'user': user,'users': users,'user-add': user_add,'controller': controller,'gamepad': gamepad,'wallet': wallet,'settings': settings,'clipboard': clipboard,'document': document,'coins': coins,'database': database,'coin': coin,'cash-bag': cash_bag,'chip': chip,'chip-spade': chip_spade,'bank': bank,'clock': clock,'shield': shield,'shield-check': shield_check,'shield-alert': shield_alert,'warning': warning,'chart': chart,'pie': pie,'table': table,'check': check,'check-solid': check_solid,'close': close,'ban': ban,'plus': plus,'plus-circle': plus_circle,'pause': pause,'tag': tag,'crown': crown,'trophy': trophy,'shirt': shirt,'bell': bell,'bolt': bolt,'info': info,'eye': eye,'link': link,'calendar': calendar,'search': search,'filter': filter,'download': download,'copy': copy,'external': external,'location': location,'mail': mail,'lock': lock,'key': key,'rocket': rocket,'receipt': receipt,'deposit': deposit,'withdrawal': withdrawal,'approved': approved};
const brands = { solana, usdc, google, apple, phantom };

export default function ConsoleIcon({ name = 'info', className = '', label, size, ...rest }) {
  const accessibility = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  if (brands[name]) return <img {...rest} {...accessibility} src={brands[name]} alt={label || ''} className={`console-icon console-brand-icon brand-${name} ${className}`} style={size ? { fontSize: size } : undefined} />;
  return <span {...rest} {...accessibility} className={`console-icon console-glyph icon-${name} ${className}`} style={{ '--mpc-icon': `url("${glyphs[name] || glyphs.info}")`, ...(size ? { fontSize: size } : {}) }} />;
}

export function CurrencyIcon({ asset, ...props }) {
  const name = ({ SOL: 'solana', WSOL: 'solana', USDC: 'usdc', USD: 'coin', CASH: 'coin', MPCE: 'clock', TIME: 'clock', FP: 'chip' })[String(asset || '').toUpperCase()];
  return name ? <ConsoleIcon name={name} {...props} /> : null;
}

export function CurrencyAmount({ asset, children }) {
  return <span className="currency-amount"><CurrencyIcon asset={asset} />{children}</span>;
}

export function LoginProvider({ provider }) {
  // The game’s Phantom wallet sign-in is persisted as `wallet` by the API.
  const recordedProvider = String(provider || '').trim().toLowerCase();
  const name = recordedProvider === 'wallet' ? 'phantom' : recordedProvider;
  const label = ({ phantom: 'Phantom', google: 'Google', apple: 'Apple', email: 'Email' })[name];
  if (!label) return <span className="login-provider is-unknown">—</span>;
  return <span className="login-provider"><ConsoleIcon name={name === 'email' ? 'mail' : name} />{label}</span>;
}
