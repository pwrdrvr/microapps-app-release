import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { createLogger } from '../../utils/logger';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';

interface IApplication {
  id: string;
  AppName: string;
  DisplayName: string;
}

interface IVersion {
  id: string;
  AppName: string;
  SemVer: string;
  Type: string;
  Status: string;
  DefaultFile?: string;
  IntegrationID: string;
}

interface IFlatRule {
  id: string;
  key: string;
  AttributeName: string;
  AttributeValue: string;
  SemVer: string;
}

interface IRules {
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
    failure(state) {},
  },
});

export const { start, success, failure } = mainSlice.actions;

export default mainSlice.reducer;

let dbclient: dynamodb.DynamoDB;
let manager: Manager;

export const fetchAppsThunk = createAsyncThunk('mainPage/fetchApps', async (_, thunkAPI) => {
  const log = createLogger('fetchAppsThunk'); //, ctx?.req?.url);

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
