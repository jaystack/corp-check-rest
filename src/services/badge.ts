import { Service, param, inject, injectable, InjectionScope } from 'functionly';
import { FileStorage } from '../stores/s3filestorages';
import { EvaluationInfo, PackageInfo } from '../types';

export const getBase64String = async (storage: FileStorage, Key: string) =>
  (<Buffer>(await storage.getObject({ Key })).Body).toString('utf8');

@injectable(InjectionScope.Singleton)
export class Badge extends Service {
  public async handle(
    @param packageInfo: PackageInfo,
    @param evaluationInfo: EvaluationInfo,
    @inject(FileStorage) files: FileStorage
  ) {
    let content = null;

    switch (true) {
      case packageInfo.state.type === 'PENDING':
        content = await getBase64String(files, '/images/status/corp-check-inprogress.svg');
        break;

      case packageInfo.state.type === 'FAILED':
      case !evaluationInfo.result:
        content = await getBase64String(files, '/images/status/corp-check-failed.svg');
        break;

      case evaluationInfo.result.qualification === 'ACCEPTED':
        content = await getBase64String(files, '/images/status/corp-check-accepted.svg');
        break;

      case evaluationInfo.result.qualification === 'RECOMMENDED':
        content = await getBase64String(files, '/images/status/corp-check-recommended.svg');
        break;

      case evaluationInfo.result.qualification === 'REJECTED':
        content = await getBase64String(files, '/images/status/corp-check-rejected.svg');
        break;

      default:
        content = await getBase64String(files, '/images/status/corp-check-failed.svg');
        break;
    }

    return content;
  }
}
