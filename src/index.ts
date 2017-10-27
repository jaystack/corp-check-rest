import { Validation, Package, PopularPackages, Suggestion, BadgeService, StressTest } from './functionalServices/rest';
import { Complete, Progress } from './functionalServices/workerComplete';
import { GetModuleMeta } from './functionalServices/moduleMetaCache';
import { CheckPopularPackages } from './functionalServices/checkPopularPackages';

export const validation = Validation.createInvoker();
export const packageInfo = Package.createInvoker();
export const popularPackages = PopularPackages.createInvoker();
export const getSuggestions = Suggestion.createInvoker();
export const badge = BadgeService.createInvoker();
export const test = StressTest.createInvoker();

export const complete = Complete.createInvoker();
export const progress = Progress.createInvoker();

export const getModuleMeta = GetModuleMeta.createInvoker();

export const checkPopularPackages = CheckPopularPackages.createInvoker();

