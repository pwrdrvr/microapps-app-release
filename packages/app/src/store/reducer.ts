import { combineReducers } from '@reduxjs/toolkit';
// import { diff } from 'jsondiffpatch';
// import { HYDRATE } from 'next-redux-wrapper';
import mainPage from './main/index';
// import { AnyAction } from '@reduxjs/toolkit';

const combinedReducer = combineReducers({
  mainPage,
});

// create your reducer
// 2021-04-13 - This was moved into the slices with next-redux-wrapper 7.0.0
// @ts-ignore
// const reducer = (state, action: AnyAction) => {
//   if (action.type === HYDRATE) {
//     const stateDiff = diff(state, action.payload) as any;
//     const wasBumpedOnClient = stateDiff?.page?.[0]?.endsWith('X'); // or any other criteria
//     return {
//       ...state,
//       ...action.payload,
//       mainPage: action.payload.mainPage !== undefined ? action.payload.mainPage : state.mainPage,
//       //indexPage: wasBumpedOnClient ? state.indexPage : action.payload.indexPage,
//       //page: wasBumpedOnClient ? state.page : action.payload.page, // keep existing state or use hydrated
//     };
//   } else {
//     return combinedReducer(state, action);
//   }
// };

export default combinedReducer;
