import { Service, param, injectable, InjectionScope } from 'functionly';
import * as request from 'request-promise-native';

export const LATEST_VERSION = 'latest';

export type PackageInfo = {
  name: string;
  version: string;
  packageJSON: any;
  latestVersion: string;
};

export class PackageNotExists extends Error {
  constructor(public name: string) {
    super();
  }
}

export class PackageVersionNotExists extends Error {
  constructor(public name: string, public version: string) {
    super();
  }
}

@injectable(InjectionScope.Singleton)
export class GetNpmInfo extends Service {
  public async handle(@param name, @param version = LATEST_VERSION) {
    const info: any = await request({
      uri: `https://registry.npmjs.org/${name.replace('/', '%2F')}`,
      json: true
    });

    if (info.name !== name) {
      throw new PackageNotExists(name);
    }

    const latestVersion = info['dist-tags'].latest;

    if (!version || version === LATEST_VERSION) {
      version = latestVersion;
    }

    if (!info.versions[version]) {
      throw new PackageVersionNotExists(name, version);
    }

    return { name, version, latestVersion, versionJSON: info.versions[version], raw: info };
  }
}
