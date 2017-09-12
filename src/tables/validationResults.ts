import { DynamoTable } from 'functionly';
import { injectable, dynamoTable } from 'functionly';

@injectable()
@dynamoTable({ tableName: '%ClassName%_corp_check' })
export class ValidationsResults extends DynamoTable {}
