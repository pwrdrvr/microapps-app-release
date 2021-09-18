import Manager from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { Config } from './config';

export class DbManager {
  private _dbClient: dynamodb.DynamoDB;
  private _manager: Manager;

  private static _instance: DbManager;
  public static get instance(): DbManager {
    if (DbManager._instance === undefined) {
      DbManager._instance = new DbManager();
    }
    return DbManager._instance;
  }

  private constructor() {
    this._dbClient = new dynamodb.DynamoDB({});
    this._manager = new Manager({
      dynamoDB: this._dbClient,
      tableName: Config.instance.db.tableName,
    });
  }

  public get dbClient(): dynamodb.DynamoDB {
    return this._dbClient;
  }

  public get manager(): Manager {
    return this._manager;
  }
}
