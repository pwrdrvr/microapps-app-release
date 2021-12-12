import { createSlice, PayloadAction, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { createLogger } from '../../utils/logger';
import { Application } from '@pwrdrvr/microapps-datalib';
import { AppState } from '../store';
import { HYDRATE } from 'next-redux-wrapper';
import { ColumnShape, SortOrder } from 'react-base-table';
import React from 'react';
import semver from 'semver';
import { DbManager } from '../../utils/dbManager';

const log = createLogger('mainSlice'); //, ctx?.req?.url);

export interface IApplication {
  AppName: string;
  DisplayName: string;
}

export interface IVersion {
  AppName: string;
  SemVer: string;
  Type: string;
  Status: string;
  DefaultFile?: string;
  IntegrationID: string;
}

export interface IFlatRule {
  key: string;
  AttributeName: string;
  AttributeValue: string;
  SemVer: string;
}

export interface IRules {
  AppName: string;
  RuleSet: IFlatRule[];
}

export type SortParams = { column?: ColumnShape; order: SortOrder; key: React.Key };

export interface IPageState {
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
  appsSortBy: SortParams;
  versionsSortBy: SortParams;
}

const initialState: IPageState = {
  apps: [],
  versions: [],
  rules: { AppName: 'init', RuleSet: [] },
  appsSortBy: { key: 'AppName', order: 'asc' },
  versionsSortBy: { key: 'SemVer', order: 'desc' },
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
    startAppSelect(state) {
      state.versions = [];
      state.rules = { AppName: 'start', RuleSet: [] };
    },
    success(state, action: PayloadAction<Partial<IPageState>>) {
      if (action.payload.apps !== undefined) {
        // We don't reload apps on row selection
        state.apps = action.payload.apps;

        state.apps = state.apps.sort((left, right): number => {
          if (state.appsSortBy.key === 'DisplayName') {
            if (left.DisplayName < right.DisplayName)
              return state.appsSortBy.order === 'asc' ? -1 : 1;
            if (left.DisplayName > right.DisplayName)
              return state.appsSortBy.order === 'asc' ? 1 : -1;
            return 0;
          }

          // Default to sorting by AppName
          if (left.AppName < right.AppName) return state.appsSortBy.order === 'asc' ? -1 : 1;
          if (left.AppName > right.AppName) return state.appsSortBy.order === 'asc' ? 1 : -1;
          return 0;
        });
      }

      state.versions = action.payload.versions || [];
      state.versions = state.versions.sort((left, right): number => {
        // Default to sorting by SemVer
        if (semver.lt(left.SemVer, right.SemVer))
          return state.versionsSortBy.order === 'asc' ? -1 : 1;
        if (semver.gt(left.SemVer, right.SemVer))
          return state.versionsSortBy.order === 'asc' ? 1 : -1;
        return 0;
      });

      state.rules = action.payload.rules || { AppName: '', RuleSet: [] };
    },
    sortApps(state, action: PayloadAction<SortParams>) {
      state.appsSortBy = action.payload;
      log.info('sortApps', { appsSortBy: state.appsSortBy });
      state.apps = state.apps.sort((left, right): number => {
        if (state.appsSortBy.key === 'DisplayName') {
          if (left.DisplayName < right.DisplayName)
            return state.appsSortBy.order === 'asc' ? -1 : 1;
          if (left.DisplayName > right.DisplayName)
            return state.appsSortBy.order === 'asc' ? 1 : -1;
          return 0;
        }

        // Default to sorting by AppName
        if (left.AppName < right.AppName) return state.appsSortBy.order === 'asc' ? -1 : 1;
        if (left.AppName > right.AppName) return state.appsSortBy.order === 'asc' ? 1 : -1;
        return 0;
      });
      log.info('sortedApps', state.apps);
    },
    sortVersions(state, action: PayloadAction<SortParams>) {
      state.versionsSortBy = action.payload;
      state.versions = state.versions.sort((left, right): number => {
        // Default to sorting by SemVer
        if (semver.lt(left.SemVer, right.SemVer))
          return state.versionsSortBy.order === 'asc' ? -1 : 1;
        if (semver.gt(left.SemVer, right.SemVer))
          return state.versionsSortBy.order === 'asc' ? 1 : -1;
        return 0;
      });
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

export const { start, success, failure, sortApps, sortVersions } = mainSlice.actions;

export default mainSlice.reducer;

export const fetchAppsThunk = createAsyncThunk('mainPage/fetchApps', async (_, thunkAPI) => {
  try {
    thunkAPI.dispatch(mainSlice.actions.start());

    // Get the apps
    const appsRaw = await Application.LoadAllApps(DbManager.instance.manager);
    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ AppName: app.AppName, DisplayName: app.DisplayName });
    }
    log.info(`got apps`, apps);

    // Get the versions
    const versionsRaw = await Application.GetVersionsAndRules({
      dbManager: DbManager.instance.manager,
      key: { AppName: 'release' },
    });
    const versions = [] as IVersion[];
    for (const version of versionsRaw.Versions) {
      versions.push({
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

export const refreshThunk = createAsyncThunk(
  'mainPage/refresh',
  async ({ appName }: { appName?: string }, thunkAPI) => {
    try {
      if (appName !== undefined) {
        thunkAPI.dispatch(mainSlice.actions.startAppSelect());
      } else {
        thunkAPI.dispatch(mainSlice.actions.start());
      }

      log.info('mainPage/refresh', { appName });

      // Fetch api/refresh
      const url =
        appName !== undefined
          ? `${window.document.URL}/api/refresh/${appName}`
          : `${window.document.URL}/api/refresh`;
      const res = await fetch(url);
      const props = (await res.json()) as IPageState;

      log.info('mainPage/refresh - got response', { props });

      return thunkAPI.dispatch(mainSlice.actions.success(props));
    } catch (error) {
      log.error(`error getting apps: ${error.message}}`);
      log.error(error);
      return thunkAPI.dispatch(mainSlice.actions.failure());
    }
  },
);

export const updateDefaultVersionThunk = createAsyncThunk(
  'mainPage/updateDefaultVersion',
  async ({ appName, semVer }: { appName: string; semVer: string }, _thunkAPI) => {
    try {
      log.info('mainPage/updateDefaultVersion', { appName });

      // Fetch api/refresh
      const url = `${window.document.URL}/api/update/default/${appName}/${semVer}`;
      const res = await fetch(url);
      const props = (await res.json()) as IPageState;

      log.info('mainPage/updateDefaultVersion - got response', { props });
    } catch (error) {
      log.error(`error getting apps: ${error.message}}`);
      log.error(error);
    }
  },
);
