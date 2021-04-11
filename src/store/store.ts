import { Action, configureStore, Store } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { MakeStore, createWrapper } from 'next-redux-wrapper';
import rootReducer from './reducer';

export type RootState = ReturnType<typeof rootReducer>;
export type AppThunk = ThunkAction<void, RootState, null, Action<any>>;

/**
 * @param initialState The store's initial state (on the client side, the state of the server-side store is passed here)
 */
const makeStore: MakeStore<RootState> = (initialState, options): Store => {
  const store: Store = configureStore({
    reducer: rootReducer,
    //preloadedState: initialState,
  });

  // @ts-ignore
  if (process.env.NODE_ENV === 'development' && module.hot) {
    // @ts-ignore
    module.hot.accept('./reducer', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const newRootReducer = require('./reducer').default;
      store.replaceReducer(newRootReducer);
    });
  }

  return store;
};

// export an assembled wrapper
export const wrapper = createWrapper<RootState>(makeStore, { debug: true });
