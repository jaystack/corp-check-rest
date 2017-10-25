import { rest, inject } from 'functionly';
import { CorpCheckRestService } from './corpCheckRestService';
import { Validation } from './rest';
import { popularPackageNames } from '../consts';

@rest({ path: '/popular-packages', methods: [ 'post' ] })
export class CheckPopularPackages extends CorpCheckRestService {
  public async handle(@inject(Validation) validate) {
    await Promise.all(
      popularPackageNames.map(async packageName => {
        console.log(packageName);
        return await validate.invoke({ packageName });
      })
    );
  }
}
