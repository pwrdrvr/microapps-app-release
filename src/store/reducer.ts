import { AnyAction } from 'redux';
import { diff } from 'jsondiffpatch';
import { HYDRATE } from 'next-redux-wrapper';
import { IPageState } from '../pages';

export interface State {
  app: string;
  page: string;
  tick: string;
  indexPage: IPageState;
}

// create your reducer
// @ts-ignore
const reducer = (state: State = { tick: 'init', app: 'init', page: 'init' }, action: AnyAction) => {
  switch (action.type) {
    case HYDRATE: {
      const stateDiff = diff(state, action.payload) as any;
      const wasBumpedOnClient = stateDiff?.page?.[0]?.endsWith('X'); // or any other criteria
      return {
        ...state,
        ...action.payload,
        page: wasBumpedOnClient ? state.page : action.payload.page, // keep existing state or use hydrated
      };
    }
    case 'TICK':
      return { ...state, tick: action.payload };
    default:
      return state;
  }
};

export default reducer;
