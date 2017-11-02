import { Service, param, injectable, InjectionScope, environment } from 'functionly';
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
    super(`'${name}' npm package not exists`);
  }
}

export class PackageVersionNotExists extends Error {
  constructor(public name: string, public version: string) {
    super(`'${version}' version not exists for package '${name}'`);
  }
}

@injectable(InjectionScope.Singleton)
//@environment('NPM_REGISTRY_URL', 'https://registry.npmjs.org')
export class GetNpmInfo extends Service {
  public async handle(@param name, @param version = LATEST_VERSION) {
    let info;

    try {
      info = await request({
        uri: `${process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org'}/${name.replace('/', '%2F')}`,
        json: true
      });
    } catch (e) {
      throw new PackageNotExists(name);
    }

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
