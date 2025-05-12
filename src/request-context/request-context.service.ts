import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  userId?: string;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: { userId?: string }, callback: () => T): T {
  return this.storage.run(context, callback);
}

  getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }
}
