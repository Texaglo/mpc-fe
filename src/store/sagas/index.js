import '../axios';
import Auth from './Auth';

import { all } from 'redux-saga/effects';

export default function* rootSaga() {
  yield all([
    Auth(),
  ]);
}
