import { Service, param, injectable, inject, InjectionScope } from 'functionly'
import { ValidationsResults } from '../tables/validationResults'
import { generate } from 'shortid'

export class MissingPackageParameters extends Error { }


@injectable(InjectionScope.Singleton)
export class GetPackageResult extends Service {
    public async handle(
        @param name,
        @param version,
        @param cid,
        @inject(ValidationsResults) validationInfoTable: ValidationsResults
    ): Promise<any> {
        let params = null
        if (name && version) {
            params = {
                FilterExpression: 'packageName = :name and packageVersion = :version and isNpmPackage = :isNpmPackage',
                ExpressionAttributeValues: { ':name': name, ':version': version, ':isNpmPackage': true }
            }
        } else if (cid) {
            params = {
                FilterExpression: 'id = :cid',
                ExpressionAttributeValues: { ':cid': cid }
            }
        }

        if (!params) throw new MissingPackageParameters()

        const result = await validationInfoTable.scan(params)
        return result.Items && result.Items.length && result.Items[0] || null
    }
}

@injectable(InjectionScope.Singleton)
export class UpdatePackageResult extends Service {
    public async handle(
        @param cid,
        @param data,
        @param result,
        @param state,
        @inject(ValidationsResults) validationInfoTable: ValidationsResults
    ): Promise<any> {

        const updated = await validationInfoTable.update({
            Key: {
                "id": cid
            },
            UpdateExpression: "set validationResult = :r, validationState=:s, validationData=:d",
            ExpressionAttributeValues: {
                ":r": result,
                ":s": { state, date: new Date().toISOString(), cid },
                ":d": data
            },
            ReturnValues: "UPDATED_NEW"
        })

        return { updated }
    }
}

@injectable(InjectionScope.Singleton)
export class CreatePackageResult extends Service {
    public async handle(
        @param name,
        @param version,
        @param packageJSON,
        @param isNpmPackage = false,
        @inject(ValidationsResults) validationInfoTable: ValidationsResults
    ) {
        if (!packageJSON) throw new MissingPackageParameters('missing packageJSON')

        const id = generate()
        const date = new Date().toISOString()
        const item = {
            id,
            packageName: name,
            packageVersion: version,
            packageJSON: JSON.stringify(packageJSON),
            isNpmPackage,
            date,
            validationState: {
                cid: id,
                date,
                state: 'Inprogress...'
            },
            validationResult: null
        }

        await validationInfoTable.put({ Item: item })

        return item
    }
}

@injectable(InjectionScope.Singleton)
export class StartPackageValidation extends Service {
    public async handle(
        @param packageJSON,
        @param cid,
    ) {
        return new Promise(resolve => setTimeout(resolve, 50))
    }
}