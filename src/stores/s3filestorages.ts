import { S3Storage, injectable, s3Storage } from 'functionly';

@injectable()
@s3Storage({ bucketName: 'corp-check-rest-%ClassName%' })
export class FileStorage extends S3Storage { }