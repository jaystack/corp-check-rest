import { inject } from 'functionly';
import { CorpCheckRestService } from './corpCheckRestService';
import { Validation } from './rest';
import { popularPackageNames } from '../consts';

export class CheckPopularDependencies extends CorpCheckRestService {
  public async handle(@inject(Validation) validate) {
    console.log(validate)
    for (const packageName of popularPackageNames) {
      console.log(packageName)
      await validate({ packageName });
    }
  }
}

export const checkPopularDependencies = CheckPopularDependencies.createInvoker();
