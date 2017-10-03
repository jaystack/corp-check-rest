import { DynamoTable } from 'functionly';
import { injectable, dynamoTable } from 'functionly';

@injectable()
@dynamoTable({ tableName: '%ClassName%_corp_check' })
export class PackageInfoCollection extends DynamoTable {}

@injectable()
@dynamoTable({ tableName: '%ClassName%_corp_check' })
export class Evaluations extends DynamoTable {}

@injectable()
@dynamoTable({ tableName: '%ClassName%_corp_check' })
export class ModuleMetadataCache extends DynamoTable {}
