import { all } from 'redux-saga/effects';
import authSagas from './Auth';
import ring from './Ring'
import sitNgo from './SitnGo';
import Tournament from './Tournament';
import Leaderboard from './Leaderboard';
import Achievement from './Achievement';
import Template from './Template';
export default function* rootSaga() {
  yield all([
    authSagas(),
    ring(),
    sitNgo(),
    Template(),
    Tournament(),
    Leaderboard(),
    Achievement(),
  ]);
}

