import React from 'react';
import { createRoot } from 'react-dom/client';
import { logger } from 'redux-logger';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import { createStore, applyMiddleware } from 'redux';

import App from './App';
import rootSaga from './store/sagas';
import rootReducer from './store/reducers';

import 'react-table-6/react-table.css';
import "./assets/css/nucleo-icons.css";
import "./assets/scss/black-dashboard-react.css";
import './assets/css/style.css';
import './assets/css/mpc-design-system.css';


const sagaMiddleware = createSagaMiddleware();
const store = createStore(rootReducer, applyMiddleware(sagaMiddleware, logger));

sagaMiddleware.run(rootSaga);
const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
if (module.hot) { module.hot.accept(App); }
