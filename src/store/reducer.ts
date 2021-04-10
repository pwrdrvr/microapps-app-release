import { AnyAction, combineReducers } from 'redux';
import { diff } from 'jsondiffpatch';
import { HYDRATE } from 'next-redux-wrapper';
import { IPageState } from '../pages';
import count from './main/index';

export interface State {
  app: string;
  page: string;
  tick: string;
  indexPage: IPageState;
}

// create your reducer
// @ts-ignore
const reducer = (
  state: State = {
    tick: 'init',
    app: 'init',
    page: 'init',
    indexPage: {
      apps: [],
      vesrions: [],
      rules: { AppName: 'none', RuleSet: [] },
    },
  },
  action: AnyAction,
) => {
  switch (action.type) {
    case HYDRATE: {
      const stateDiff = diff(state, action.payload) as any;
      const wasBumpedOnClient = stateDiff?.page?.[0]?.endsWith('X'); // or any other criteria
      return {
        ...state,
        ...action.payload,
        //indexPage: wasBumpedOnClient ? state.indexPage : action.payload.indexPage,
        page: wasBumpedOnClient ? state.page : action.payload.page, // keep existing state or use hydrated
      };
    }
    case 'TICK':
      return { ...state, tick: action.payload };
    case 'MAIN':
      return { ...state, indexPage: action.payload };
    default:
      return state;
  }
};

// const reducers = combineReducers({
//   count,
// });

export default reducer;
