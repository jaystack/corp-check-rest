import 'jest';
import license from '../src/evaluators/license';
import version from '../src/evaluators/version';
import npmScores from '../src/evaluators/npmScores';
import { LogType } from 'corp-check-core';

describe('evaluators', () => {
  describe('licnese', () => {
    describe('common', () => {
      it('no params', async () => {
        try {
          const result = license(undefined);
          expect(true).toBe(false);
        } catch (e) {
          expect(true).toBe(true);
        }
      });

      it('undefined node - rule', async () => {
        try {
          const result = license({
            node: undefined,
            rule: undefined,
            depth: undefined,
            packageMeta: undefined,
            unknownPackages: []
          });
          expect(true).toBe(false);
        } catch (e) {
          expect(true).toBe(true);
        }
      });

      it('undefined node', async () => {
        try {
          const result = license({
            node: undefined,
            rule: {},
            depth: undefined,
            packageMeta: undefined,
            unknownPackages: []
          });
          expect(true).toBe(false);
        } catch (e) {
          expect(true).toBe(true);
        }
      });

      it('undefined rule', async () => {
        try {
          const result = license({
            node: {
              name: 'name',
              version: 'version',
              license: { type: null, hasLicenseFile: false, isPrivate: false },
              dependencies: []
            },
            rule: undefined,
            depth: undefined,
            packageMeta: undefined,
            unknownPackages: []
          });
          expect(true).toBe(false);
        } catch (e) {
          expect(true).toBe(true);
        }
      });

      it('empty rule config without license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: null, hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: {},
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('empty rule config with license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: {},
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('empty rule config with licenses AND', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT AND ISC', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: {},
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('empty rule config with licenses AND', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT OR ISC', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: {},
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('non spdx license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'mit', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: {},
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });
    });

    describe('licenseRequired', () => {
      it('licenseRequired: false - without license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: null, hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { licenseRequired: false },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('licenseRequired: false - with license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { licenseRequired: false },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('licenseRequired: true - without license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: null, hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { licenseRequired: true },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Missing license',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('licenseRequired: true - with license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { licenseRequired: true },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });
    });

    describe('exclude', () => {
      it('empty - without license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: null, hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('empty - with license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with license not included', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [ 'ISC' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with license not included AND', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT AND WTFPL', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [ 'ISC' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with license not included OR', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT OR WTFPL', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [ 'ISC' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with license included', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [ 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Forbidden license: MIT',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with license included 2', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [ 'ISC', 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Forbidden license: MIT',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with license included AND', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT AND WTFPL', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [ 'ISC', 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Forbidden license: MIT',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with license included OR', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT OR WTFPL', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [ 'ISC', 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with non spdx license included', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'license', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [ 'MIT', 'license' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Forbidden license: license',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with non spdx license not included', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'license', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { exclude: [ 'ISC' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });
    });

    describe('include', () => {
      it('empty - without license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: null, hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('empty - with license', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Not allowed license: MIT',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('empty - with license AND', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT AND ISC', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Not allowed license: MIT',
              type: LogType.ERROR
            },
            {
              message: 'Not allowed license: ISC',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('empty - with license OR', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT OR ISC', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Not allowed license: MIT',
              type: LogType.ERROR
            },
            {
              message: 'Not allowed license: ISC',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with license not included', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'ISC' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Not allowed license: MIT',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with license not included AND', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT AND WTFPL', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'ISC' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Not allowed license: MIT',
              type: LogType.ERROR
            },
            {
              message: 'Not allowed license: WTFPL',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with license one included AND', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT AND WTFPL', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'ISC', 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Not allowed license: WTFPL',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with license not included OR', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT OR WTFPL', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'ISC' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Not allowed license: MIT',
              type: LogType.ERROR
            },
            {
              message: 'Not allowed license: WTFPL',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with license included', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with license included 2', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'ISC', 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with license included 3', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'BSD-3-Clause', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'BSD-3-Clause' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with license included AND', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT AND ISC', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'ISC', 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with license included AND', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT AND ISC', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'ISC', 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with license included OR', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'MIT OR ISC', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'MIT' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });

      it('with non spdx license not included', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'license', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'ISC' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Not allowed license: license',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('with license included', async () => {
        const result = license({
          node: {
            name: 'name',
            version: 'version',
            license: { type: 'license', hasLicenseFile: false, isPrivate: false },
            dependencies: []
          },
          rule: { include: [ 'MIT', 'license' ] },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'license',
          description: '',
          score: 1,
          logs: []
        });
      });
    });
  });

  describe('version', () => {
    describe('common', () => {
      it('no params', async () => {
        try {
          const result = version(undefined);
          expect(true).toBe(false);
        } catch (e) {
          expect(true).toBe(true);
        }
      });
    });

    describe('retributionScore', () => {
      it('under', async () => {
        const result = version({
          node: {
            name: 'name',
            version: '0.1.0',
            license: undefined,
            dependencies: []
          },
          rule: { minVersion: '1.0.0', retributionScore: 0.8, rigorousDepth: 1, isRigorous: false },
          depth: 0,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'version',
          description: '',
          score: 0.8,
          logs: [
            {
              message: 'Unstable version: 0.1.0',
              type: LogType.WARNING
            }
          ]
        });
      });
    });

    describe('minVersion', () => {
      it('under', async () => {
        const result = version({
          node: {
            name: 'name',
            version: '0.1.0',
            license: undefined,
            dependencies: []
          },
          rule: { minVersion: '1.0.0', retributionScore: 0.5, rigorousDepth: 1, isRigorous: false },
          depth: 0,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'version',
          description: '',
          score: 0.5,
          logs: [
            {
              message: 'Unstable version: 0.1.0',
              type: LogType.WARNING
            }
          ]
        });
      });
      it('below', async () => {
        const result = version({
          node: {
            name: 'name',
            version: '1.1.0',
            license: undefined,
            dependencies: []
          },
          rule: { minVersion: '1.0.0' },
          depth: undefined,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'version',
          description: '',
          score: 1,
          logs: []
        });
      });
    });

    describe('isRigorous', () => {
      it('rigorousDepth > depth', async () => {
        const result = version({
          node: {
            name: 'name',
            version: '0.1.0',
            license: undefined,
            dependencies: []
          },
          rule: { minVersion: '1.0.0', retributionScore: 0.5, rigorousDepth: 1, isRigorous: true },
          depth: 0,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'version',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Unstable version: 0.1.0',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('rigorousDepth === depth', async () => {
        const result = version({
          node: {
            name: 'name',
            version: '0.1.0',
            license: undefined,
            dependencies: []
          },
          rule: { minVersion: '1.0.0', rigorousDepth: 1, isRigorous: true },
          depth: 1,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'version',
          description: '',
          score: 0,
          logs: [
            {
              message: 'Unstable version: 0.1.0',
              type: LogType.ERROR
            }
          ]
        });
      });

      it('rigorousDepth < depth', async () => {
        const result = version({
          node: {
            name: 'name',
            version: '0.1.0',
            license: undefined,
            dependencies: []
          },
          rule: { minVersion: '1.0.0', retributionScore: 0.5, rigorousDepth: 1, isRigorous: true },
          depth: 2,
          packageMeta: undefined,
          unknownPackages: []
        });

        expect(result).toEqual({
          name: 'version',
          description: '',
          score: 0.5,
          logs: [
            {
              message: 'Unstable version: 0.1.0',
              type: LogType.WARNING
            }
          ]
        });
      });
    });
  });

  describe('version - unknownPackages', () => {
    it('pkg1', async () => {
      const result = version({
        node: {
          name: 'name',
          version: '1.0.0',
          license: undefined,
          dependencies: []
        },
        rule: { minVersion: '1.0.0', retributionScore: 0.5, rigorousDepth: 1, isRigorous: false },
        depth: 0,
        packageMeta: undefined,
        unknownPackages: [ 'pkg1' ]
      });

      expect(result).toEqual({
        name: 'version',
        description: '',
        score: 0.5,
        logs: [
          {
            message: 'Unknown package: pkg1',
            type: LogType.WARNING
          }
        ]
      });
    });

    it('pkg1, pkg2', async () => {
      const result = version({
        node: {
          name: 'name',
          version: '1.0.0',
          license: undefined,
          dependencies: []
        },
        rule: { minVersion: '1.0.0', retributionScore: 0.5, rigorousDepth: 1, isRigorous: false },
        depth: 0,
        packageMeta: undefined,
        unknownPackages: [ 'pkg1', 'pkg2' ]
      });

      expect(result).toEqual({
        name: 'version',
        description: '',
        score: 0.5,
        logs: [
          {
            message: 'Unknown package: pkg1',
            type: LogType.WARNING
          },
          {
            message: 'Unknown package: pkg2',
            type: LogType.WARNING
          }
        ]
      });
    });

    it('pkg1, pkg2 - depth 1', async () => {
      const result = version({
        node: {
          name: 'name',
          version: '1.0.0',
          license: undefined,
          dependencies: []
        },
        rule: { minVersion: '1.0.0', rigorousDepth: 1, isRigorous: false },
        depth: 1,
        packageMeta: undefined,
        unknownPackages: [ 'pkg1', 'pkg2' ]
      });

      expect(result).toEqual({
        name: 'version',
        description: '',
        score: 1,
        logs: []
      });
    });
  });

  describe('npmScores', () => {
    it('no params', async () => {
      try {
        const result = npmScores(undefined);
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });

    it('no packageMeta', async () => {
      try {
        const result = npmScores({
          node: {
            name: 'name',
            version: 'version',
            license: undefined,
            dependencies: []
          },
          rule: {},
          depth: 0,
          packageMeta: undefined,
          unknownPackages: []
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });

    it('no npmScores', async () => {
      try {
        const result = npmScores({
          node: {
            name: 'name',
            version: 'version',
            license: undefined,
            dependencies: []
          },
          rule: {},
          depth: 0,
          packageMeta: { npmScores: undefined },
          unknownPackages: []
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });

    it('scores', async () => {
      const result = npmScores({
        node: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        rule: {},
        depth: 0,
        packageMeta: {
          npmScores: {
            quality: 0.9,
            popularity: 0.9,
            maintenance: 0.9
          }
        },
        unknownPackages: []
      });

      expect(result).toEqual({
        name: 'npm-scores',
        description: '',
        score: 0.9,
        logs: [
          {
            message: 'Quality: 90%',
            type: LogType.INFO
          },
          {
            message: 'Popularity: 90%',
            type: LogType.INFO
          },
          {
            message: 'Maintenance: 90%',
            type: LogType.INFO
          }
        ]
      });
    });

    it('null quality', async () => {
      const result = npmScores({
        node: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        rule: {},
        depth: 0,
        packageMeta: {
          npmScores: {
            quality: null,
            popularity: 0.9,
            maintenance: 0.9
          }
        },
        unknownPackages: []
      });

      expect(result).toEqual({
        name: 'npm-scores',
        description: '',
        score: 0.6,
        logs: [
          {
            message: 'Quality: unknown',
            type: LogType.WARNING
          },
          {
            message: 'Popularity: 90%',
            type: LogType.INFO
          },
          {
            message: 'Maintenance: 90%',
            type: LogType.INFO
          }
        ]
      });
    });

    it('undefined quality', async () => {
      const result = npmScores({
        node: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        rule: {},
        depth: 0,
        packageMeta: {
          npmScores: {
            quality: undefined,
            popularity: 0.9,
            maintenance: 0.9
          }
        },
        unknownPackages: []
      });

      expect(result).toEqual({
        name: 'npm-scores',
        description: '',
        score: 0.6,
        logs: [
          {
            message: 'Quality: unknown',
            type: LogType.WARNING
          },
          {
            message: 'Popularity: 90%',
            type: LogType.INFO
          },
          {
            message: 'Maintenance: 90%',
            type: LogType.INFO
          }
        ]
      });
    });

    it('not defined quality', async () => {
      const scores: any = { popularity: 0.9, maintenance: 0.9 };
      const result = npmScores({
        node: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        rule: {},
        depth: 0,
        packageMeta: { npmScores: scores },
        unknownPackages: []
      });

      expect(result).toEqual({
        name: 'npm-scores',
        description: '',
        score: 0.6,
        logs: [
          {
            message: 'Quality: unknown',
            type: LogType.WARNING
          },
          {
            message: 'Popularity: 90%',
            type: LogType.INFO
          },
          {
            message: 'Maintenance: 90%',
            type: LogType.INFO
          }
        ]
      });
    });

    it('different values', async () => {
      const result = npmScores({
        node: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        rule: {},
        depth: 0,
        packageMeta: {
          npmScores: {
            quality: 0.8,
            popularity: 0.6,
            maintenance: 0.4
          }
        },
        unknownPackages: []
      });

      expect(result).toEqual({
        name: 'npm-scores',
        description: '',
        score: 0.6,
        logs: [
          {
            message: 'Quality: 80%',
            type: LogType.INFO
          },
          {
            message: 'Popularity: 60%',
            type: LogType.INFO
          },
          {
            message: 'Maintenance: 40%',
            type: LogType.WARNING
          }
        ]
      });
    });

    it('warning limit', async () => {
      const result = npmScores({
        node: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        rule: {},
        depth: 0,
        packageMeta: {
          npmScores: {
            quality: 0.6,
            popularity: 0.5,
            maintenance: 0.4
          }
        },
        unknownPackages: []
      });

      expect(result).toEqual({
        name: 'npm-scores',
        description: '',
        score: 0.5,
        logs: [
          {
            message: 'Quality: 60%',
            type: LogType.INFO
          },
          {
            message: 'Popularity: 50%',
            type: LogType.INFO
          },
          {
            message: 'Maintenance: 40%',
            type: LogType.WARNING
          }
        ]
      });
    });

    it('qualityWeight', async () => {
      const result = npmScores({
        node: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        rule: { qualityWeight: 0 },
        depth: 0,
        packageMeta: {
          npmScores: {
            quality: 0.5,
            popularity: 0.9,
            maintenance: 0.9
          }
        },
        unknownPackages: []
      });

      expect(result).toEqual({
        name: 'npm-scores',
        description: '',
        score: 0.9,
        logs: [
          {
            message: 'Quality: 50%',
            type: LogType.INFO
          },
          {
            message: 'Popularity: 90%',
            type: LogType.INFO
          },
          {
            message: 'Maintenance: 90%',
            type: LogType.INFO
          }
        ]
      });
    });

    it('popularityWeight', async () => {
      const result = npmScores({
        node: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        rule: { popularityWeight: 0 },
        depth: 0,
        packageMeta: {
          npmScores: {
            quality: 0.9,
            popularity: 0.5,
            maintenance: 0.9
          }
        },
        unknownPackages: []
      });

      expect(result).toEqual({
        name: 'npm-scores',
        description: '',
        score: 0.9,
        logs: [
          {
            message: 'Quality: 90%',
            type: LogType.INFO
          },
          {
            message: 'Popularity: 50%',
            type: LogType.INFO
          },
          {
            message: 'Maintenance: 90%',
            type: LogType.INFO
          }
        ]
      });
    });

    it('maintenanceWeight', async () => {
      const result = npmScores({
        node: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        rule: { maintenanceWeight: 0 },
        depth: 0,
        packageMeta: {
          npmScores: {
            quality: 0.9,
            popularity: 0.9,
            maintenance: 0.5
          }
        },
        unknownPackages: []
      });

      expect(result).toEqual({
        name: 'npm-scores',
        description: '',
        score: 0.9,
        logs: [
          {
            message: 'Quality: 90%',
            type: LogType.INFO
          },
          {
            message: 'Popularity: 90%',
            type: LogType.INFO
          },
          {
            message: 'Maintenance: 50%',
            type: LogType.INFO
          }
        ]
      });
    });
  });
});
