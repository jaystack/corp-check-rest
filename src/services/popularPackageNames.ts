import { injectable, InjectionScope, Service, inject } from 'functionly';
import { PopularPackageNames as PopularPackageNameCollection } from '../stores/mongoCollections';

const popularPackageNames = [
  'lodash',
  'request',
  'async',
  'chalk',
  'express',
  'bluebird',
  'commander',
  'debug',
  'underscore',
  'react',
  'moment'
];

@injectable(InjectionScope.Singleton)
export class PopularPackageNames extends Service {
  public async handle(@inject(PopularPackageNameCollection) popularPackageNameCollection: PopularPackageNameCollection) {
    const docs = await popularPackageNameCollection.find().toArray();
    if (docs.length === 0) {
      await popularPackageNameCollection.insertMany(popularPackageNames.map(name => ({ name })));
      return popularPackageNames;
    }
    return docs.map(({ name }) => name);
  }
}
