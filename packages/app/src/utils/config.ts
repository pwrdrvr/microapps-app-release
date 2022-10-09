interface IDatabaseConfig {
  tableName: string;
}

export interface IConfig {
  db: IDatabaseConfig;
}

export class Config implements IConfig {
  private static _instance: IConfig;
  public static get instance(): IConfig {
    if (Config._instance === undefined) {
      Config._instance = {
        db: {
          tableName: process.env.DATABASE_TABLE_NAME || 'MicroApps',
        },
      };
    }
    return Config._instance;
  }

  public static get envLevel(): 'dev' | 'qa' | 'prod' | 'local' {
    const nodeEnv = process.env.NODE_CONFIG_ENV || 'dev';
    if (nodeEnv.startsWith('prod')) {
      return 'prod';
    } else if ((nodeEnv as string) === 'qa') {
      return 'qa';
    } else if ((nodeEnv as string) === 'local') {
      return 'local';
    }
    return 'dev';
  }

  public get db(): IDatabaseConfig {
    return this.db;
  }
}
