import { DBManager } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { Config } from './config';

export class DbManager {
  private _dynamoClient: dynamodb.DynamoDBClient;
  private _manager: DBManager;

  private static _instance: DbManager;
  public static get instance(): DbManager {
    if (DbManager._instance === undefined) {
      DbManager._instance = new DbManager();
    }
    return DbManager._instance;
  }

  public constructor() {
    this._dynamoClient = new dynamodb.DynamoDB({});
    this._manager = new DBManager({
      dynamoClient: this._dynamoClient,
      tableName: Config.instance.db.tableName,
    });
  }

  public get dbClient(): dynamodb.DynamoDBClient {
    return this._dynamoClient;
  }

  public get manager(): DBManager {
    return this._manager;
  }
}
