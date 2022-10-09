import { Action, AnyAction, configureStore, ThunkAction, ThunkDispatch } from '@reduxjs/toolkit';
import { createWrapper, HYDRATE } from 'next-redux-wrapper';
import combinedReducer from './reducer';

export type RootState = ReturnType<typeof combinedReducer>;

const reducer: typeof combinedReducer = (state, action) => {
  if (action.type === HYDRATE) {
    const nextState = {
      ...state,
      ...action.payload,
    };
    return nextState;
  } else {
    return combinedReducer(state, action);
  }
};

/**
 * @param initialState The store's initial state (on the client side, the state of the server-side store is passed here)
 */
const makeStore = () => {
  const store = configureStore({ reducer });

  // @ts-ignore
  // if (process.env.NODE_ENV === 'development' && module.hot) {
  //   // @ts-ignore
  //   module.hot.accept('./reducer', () => {
  //     // eslint-disable-next-line @typescript-eslint/no-var-requires
  //     const newRootReducer = require('./reducer').default;
  //     store.replaceReducer(newRootReducer);
  //   });
  // }

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore['getState']>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, AppState, unknown, Action>;

// export an assembled wrapper
// Pre-7.0.0-rc.1: export const wrapper = createWrapper<RootState>(makeStore, { debug: true });
export const wrapper = createWrapper<AppStore>(makeStore);

// This is an alternative way to create a type for dispatch() that includes
// the async support.
// To use this in a component:
// const dispatch: AppDispatch = useDispatch();
export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;

//export type AppDispatch = typeof store.dispatch;
