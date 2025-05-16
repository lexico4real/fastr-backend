import { Injectable, OnModuleInit } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  userId?: string;
}

@Injectable()
export class RequestContextService implements OnModuleInit {
  private readonly storage = new AsyncLocalStorage<RequestContext>();
  private static instance: RequestContextService;

  onModuleInit() {
    RequestContextService.instance = this;
  }

  static getInstance(): RequestContextService {
    return RequestContextService.instance;
  }

  run<T>(context: { userId?: string }, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }
}
