import { combineReducers, AnyAction } from 'redux';
import { diff } from 'jsondiffpatch';
import mainPage from './main/index';
import { HYDRATE } from 'next-redux-wrapper';

const combinedReducer = combineReducers({
  //reducer,
  mainPage,
});

const reducer = (state, action: AnyAction) => {
  if (action.type === HYDRATE) {
    // const nextState = {
    //   ...state, // use previous state
    //   ...action.payload, // apply delta from hydration
    // };
    // if (state.count.count) nextState.count.count = state.count.count; // preserve count value on client side navigation
    // return nextState;
    const stateDiff = diff(state, action.payload) as any;
    const wasBumpedOnClient = stateDiff?.page?.[0]?.endsWith('X'); // or any other criteria
    return {
      ...state,
      ...action.payload,
      indexPage: wasBumpedOnClient ? state.indexPage : action.payload.indexPage,
      page: wasBumpedOnClient ? state.page : action.payload.page, // keep existing state or use hydrated
    };
  } else {
    return combinedReducer(state, action);
  }
};

// create your reducer
// @ts-ignore
// const reducer = (
//   state: State = {
//     tick: 'init',
//     app: 'init',
//     page: 'init',
//     indexPage: {
//       apps: [],
//       versions: [],
//       rules: { AppName: 'none', RuleSet: [] },
//     },
//   },
//   action: AnyAction,
// ) => {
//   switch (action.type) {
//     case HYDRATE: {
//       const stateDiff = diff(state, action.payload) as any;
//       const wasBumpedOnClient = stateDiff?.page?.[0]?.endsWith('X'); // or any other criteria
//       return {
//         ...state,
//         ...action.payload,
//         //indexPage: wasBumpedOnClient ? state.indexPage : action.payload.indexPage,
//         page: wasBumpedOnClient ? state.page : action.payload.page, // keep existing state or use hydrated
//       };
//     }
//     case 'TICK':
//       return { ...state, tick: action.payload };
//     case 'MAIN':
//       return { ...state, indexPage: action.payload };
//     default:
//       return state;
//   }
// };

export default reducer;
