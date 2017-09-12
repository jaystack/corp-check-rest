import { PostHook, error } from 'functionly';

export class ErrorTransform extends PostHook {
  public async catch(@error e) {
    console.log(e);
    return {
      status: 500,
      data: {
        name: e instanceof Error ? e.constructor.name : 'Error',
        message: e.message,
        date: new Date(),
        data: JSON.stringify(e)
      }
    };
  }
}
