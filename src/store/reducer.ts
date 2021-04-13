import { AnyAction, CombinedState, combineReducers } from 'redux';
import { diff } from 'jsondiffpatch';
import { HYDRATE } from 'next-redux-wrapper';
// import { IPageState } from '../pages';
import mainPage from './main/index';
// import count from './main/index';

// export interface State {
//   app: string;
//   page: string;
//   tick: string;
//   indexPage: IPageState;
// }

const combinedReducer = combineReducers({
  mainPage,
});

// create your reducer
// @ts-ignore
const reducer = (state, action: AnyAction) => {
  if (action.type === HYDRATE) {
    const stateDiff = diff(state, action.payload) as any;
    const wasBumpedOnClient = stateDiff?.page?.[0]?.endsWith('X'); // or any other criteria
    return {
      ...state,
      ...action.payload,
      mainPage: action.payload.mainPage !== undefined ? action.payload.mainPage : state.mainPage,
      //indexPage: wasBumpedOnClient ? state.indexPage : action.payload.indexPage,
      //page: wasBumpedOnClient ? state.page : action.payload.page, // keep existing state or use hydrated
    };
  } else {
    return combinedReducer(state, action);
  }
};

// const reducers = combineReducers({
//   count,
// });

export default reducer;
