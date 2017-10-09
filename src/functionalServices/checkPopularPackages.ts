import { rest, inject } from 'functionly';
import { CorpCheckRestService } from './corpCheckRestService';
import { Validation } from './rest';
import { popularPackageNames } from '../consts';

@rest({ path: '/popular-packages', methods: [ 'post' ] })
export class CheckPopularPackages extends CorpCheckRestService {
  public async handle(@inject(Validation) validate) {
    for (const packageName of popularPackageNames) {
      console.log(packageName);
      validate.invoke({ packageName });
    }
  }
}

export const checkPopularPackages = CheckPopularPackages.createInvoker();
