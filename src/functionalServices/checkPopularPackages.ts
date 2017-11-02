import { rest, inject } from 'functionly';
import { CorpCheckRestService } from './corpCheckRestService';
import { Validation } from './rest';
import { PopularPackageNames } from '../services/popularPackageNames';

@rest({ path: '/popular-packages', methods: [ 'post' ] })
export class CheckPopularPackages extends CorpCheckRestService {
  public async handle(@inject(PopularPackageNames) popularPackageNameService, @inject(Validation) validate) {
    const popularPackageNames = await popularPackageNameService();
    await Promise.all(
      popularPackageNames.map(async packageName => {
        console.log(packageName);
        return await validate.invoke({ packageName });
      })
    );
  }
}
