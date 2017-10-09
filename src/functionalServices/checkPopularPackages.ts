import { param, inject } from 'functionly';
import { CorpCheckRestService } from './corpCheckRestService';
import { Validation } from './rest';
import { popularPackageNames } from '../consts';

export class CheckPopularDependencies extends CorpCheckRestService {
  public async handle(@inject(Validation) validate) {
    await Promise.all(popularPackageNames.map(packageName => validate({ packageName })));
  }
}

export const checkPopularDependencies = CheckPopularDependencies.createInvoker();
