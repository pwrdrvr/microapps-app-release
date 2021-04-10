// store.ts

import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { MakeStore, createWrapper, Context } from 'next-redux-wrapper';
import reducer, { State } from './reducer';

// create a makeStore function
const makeStore: MakeStore<State> = (_context: Context) =>
  createStore(reducer, applyMiddleware(thunk));

// export an assembled wrapper
export const wrapper = createWrapper<State>(makeStore, { debug: true });
