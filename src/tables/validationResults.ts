import { DynamoTable, MongoCollection } from 'functionly';
import { injectable, mongoCollection, mongoConnection } from 'functionly';

@injectable()
@mongoConnection(process.env.MONGOLOCALURL || 'mongodb://18.194.50.126:27017/corp-check')
@mongoCollection({ collectionName: '%ClassName%_corp_check' })
export class ValidationsResults extends MongoCollection {}
