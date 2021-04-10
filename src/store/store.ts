// store.ts

import { createStore, AnyAction, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { MakeStore, createWrapper, Context, HYDRATE } from 'next-redux-wrapper';
import { State } from './reducer';

// create your reducer
const reducer = (state: State = { tick: 'init' }, action: AnyAction) => {
  switch (action.type) {
    case HYDRATE:
      // Attention! This will overwrite client state! Real apps should use proper reconciliation.
      return { ...state, ...action.payload };
    case 'TICK':
      return { ...state, tick: action.payload };
    default:
      return state;
  }
};

// create a makeStore function
const makeStore: MakeStore<State> = (_context: Context) =>
  createStore(reducer, applyMiddleware(thunk));

// export an assembled wrapper
export const wrapper = createWrapper<State>(makeStore, { debug: true });
