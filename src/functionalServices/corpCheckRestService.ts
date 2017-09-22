import { FunctionalService, NoCallbackWaitsForEmptyEventLoop } from 'functionly';
import { aws, use } from 'functionly';
import { ErrorTransform } from '../middleware/errorTransform';

@aws({ type: 'nodejs6.10', memorySize: 512, timeout: 3 })
@use(NoCallbackWaitsForEmptyEventLoop)
@use(ErrorTransform)
export class CorpCheckRestService extends FunctionalService {}