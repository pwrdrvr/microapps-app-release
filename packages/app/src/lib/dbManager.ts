import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const databaseTableName = process.env.DATABASE_TABLE_NAME || 'MicroApps';

export class DbManager {
  private _dynamoClient: DynamoDBClient;
  private _documentClient: DynamoDBDocumentClient;

  private static _instance: DbManager;

  public static get instance(): DbManager {
    if (DbManager._instance === undefined) {
      DbManager._instance = new DbManager();
    }

    return DbManager._instance;
  }

  public constructor() {
    this._dynamoClient = new DynamoDBClient({});
    this._documentClient = DynamoDBDocumentClient.from(this._dynamoClient);
  }

  public get tableName(): string {
    return databaseTableName;
  }

  public get documentClient(): DynamoDBDocumentClient {
    return this._documentClient;
  }
}
