import { createSlice, PayloadAction, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { createLogger } from '../../utils/logger';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { AppState } from '../store';
import { HYDRATE } from 'next-redux-wrapper';

const log = createLogger('mainSlice'); //, ctx?.req?.url);

export interface IApplication {
  id: string;
  AppName: string;
  DisplayName: string;
}

export interface IVersion {
  id: string;
  AppName: string;
  SemVer: string;
  Type: string;
  Status: string;
  DefaultFile?: string;
  IntegrationID: string;
}

export interface IFlatRule {
  id: string;
  key: string;
  AttributeName: string;
  AttributeValue: string;
  SemVer: string;
}

export interface IRules {
  AppName: string;
  RuleSet: IFlatRule[];
}

export interface IPageState {
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
}

const initialState: IPageState = {
  apps: [],
  versions: [],
  rules: { AppName: 'init', RuleSet: [] },
};

const hydrate = createAction<AppState>(HYDRATE);

const mainSlice = createSlice({
  name: 'mainPage',
  initialState,
  reducers: {
    start(state) {
      state.apps = [];
      state.versions = [];
      state.rules = { AppName: 'start', RuleSet: [] };
    },
    success(state, action: PayloadAction<IPageState>) {
      state.apps = action.payload.apps;
      state.versions = action.payload.versions;
      state.rules = action.payload.rules;
    },
    failure(state) {
      // Nothing here yet
    },
  },
  extraReducers(builder) {
    builder.addCase(hydrate, (state, action) => {
      log.info('HYDRATE', { state, payload: action.payload });
      return {
        ...state,
        ...(action.payload as any)[mainSlice.name],
      };
    });
  },
});

export const { start, success, failure } = mainSlice.actions;

export default mainSlice.reducer;

let dbclient: dynamodb.DynamoDB;
let manager: Manager;

export const fetchAppsThunk = createAsyncThunk('mainPage/fetchApps', async (_, thunkAPI) => {
  try {
    thunkAPI.dispatch(mainSlice.actions.start());

    if (manager === undefined) {
      dbclient = new dynamodb.DynamoDB({});
      manager = new Manager(dbclient);
    }

    // Get the apps
    const appsRaw = await Application.LoadAllAppsAsync(dbclient);
    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ id: app.AppName, AppName: app.AppName, DisplayName: app.DisplayName });
    }
    log.info(`got apps`, apps);

    // Get the versions
    const versionsRaw = await manager.GetVersionsAndRules('release');
    const versions = [] as IVersion[];
    for (const version of versionsRaw.Versions) {
      versions.push({
        id: version.SemVer,
        AppName: version.AppName,
        SemVer: version.SemVer,
        Type: version.Type,
        Status: version.Status,
        //DefaultFile: version.DefaultFile,
        IntegrationID: version.IntegrationID,
      });
    }
    //log.info(`got versions`, versions);

    // Get the rules
    const rules = {} as IRules;
    rules.AppName = versionsRaw.Rules.AppName;
    rules.RuleSet = [];
    for (const key of Object.keys(versionsRaw.Rules.RuleSet)) {
      const rule = versionsRaw.Rules.RuleSet[key];
      rules.RuleSet.push({
        id: key,
        key,
        AttributeName: rule.AttributeName ?? '',
        AttributeValue: rule.AttributeValue ?? '',
        SemVer: rule.SemVer,
      });
    }
    //log.info(`got rules`, versions);

    return thunkAPI.dispatch(mainSlice.actions.success({ apps, versions, rules }));
  } catch (error) {
    log.error(`error getting apps: ${error.message}}`);
    log.error(error);
    return thunkAPI.dispatch(mainSlice.actions.failure());
  }
});

const testPayload: IPageState = {
  apps: [{ id: 'cat', AppName: 'client: cat', DisplayName: 'client: dog' }],
  versions: [
    {
      id: 'cat',
      AppName: 'client: cat',
      SemVer: '0.0.0',
      DefaultFile: 'index.html',
      Status: 'done?',
      IntegrationID: 'none',
      Type: 'next.js',
    },
  ],
  rules: {
    AppName: 'client: cat',
    RuleSet: [
      {
        id: 'client:default',
        key: 'client:default',
        AttributeName: '',
        AttributeValue: '',
        SemVer: '0.0.0',
      },
    ],
  },
};

export const refreshThunk = createAsyncThunk('mainPage/refresh', async (_, thunkAPI) => {
  try {
    thunkAPI.dispatch(mainSlice.actions.start());

    log.info('mainPage/refresh');

    // TODO: Fetch api/refresh
    const res = await fetch(`${window.document.URL}/api/refresh`);
    const props = (await res.json()) as IPageState;

    log.info('mainPage/refresh - got response', { props });

    // Mutate the items so it is detectable in the UI
    for (const app of props.apps) {
      app.DisplayName = 'client: ' + app.DisplayName;
    }

    return thunkAPI.dispatch(mainSlice.actions.success(props));
  } catch (error) {
    log.error(`error getting apps: ${error.message}}`);
    log.error(error);
    return thunkAPI.dispatch(mainSlice.actions.failure());
  }
});
