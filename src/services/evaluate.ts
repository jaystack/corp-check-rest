import { Service, param, injectable, InjectionScope } from 'functionly'

@injectable(InjectionScope.Singleton)
export class Evaluate extends Service {
    public async handle(
        @param data,
        @param cid,
    ) {
        return {
            points: 9.5,
            text: 'Recommended'
        }
    }
}