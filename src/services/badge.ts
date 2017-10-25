import { Service, param, inject, injectable, InjectionScope } from 'functionly';
import { Qualification } from 'corp-check-core';
import { FileStorage } from '../stores/s3filestorages';
import { EvaluationInfo, PackageInfo, StateType } from '../types';

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

    if (packageInfo && packageInfo.state) {
      switch (true) {
        case packageInfo.state.type === StateType.PENDING:
          content = await getBase64String(files, '/images/status/corp-check-inprogress.svg');
          break;

        case packageInfo.state.type === StateType.FAILED:
        case !evaluationInfo.result:
          content = await getBase64String(files, '/images/status/corp-check-failed.svg');
          break;

        case evaluationInfo.result.qualification === Qualification.ACCEPTED:
          content = await getBase64String(files, '/images/status/corp-check-accepted.svg');
          break;

        case evaluationInfo.result.qualification === Qualification.RECOMMENDED:
          content = await getBase64String(files, '/images/status/corp-check-recommended.svg');
          break;

        case evaluationInfo.result.qualification === Qualification.REJECTED:
          content = await getBase64String(files, '/images/status/corp-check-rejected.svg');
          break;

        default:
          content = await getBase64String(files, '/images/status/corp-check-failed.svg');
          break;
      }
    }

    return content;
  }
}
