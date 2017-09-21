import { DynamoTable, MongoCollection } from 'functionly';
import { injectable, mongoCollection, mongoConnection } from 'functionly';

export const mongoUrl = process.env.MONGOLOCALURL || 'mongodb://18.194.50.126:27017/corp-check'

@injectable()
@mongoConnection(mongoUrl)
@mongoCollection({ collectionName: '%ClassName%_corp_check' })
export class PackageInfoCollection extends MongoCollection {}

@injectable()
@mongoConnection(mongoUrl)
@mongoCollection({ collectionName: '%ClassName%_corp_check' })
export class Evaluations extends MongoCollection {}
