import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { RequestContextService } from 'src/request-context/request-context.service';

@EventSubscriber()
@Injectable()
export class BaseEntitySubscriber implements EntitySubscriberInterface {
  constructor(private readonly contextService: RequestContextService) {
    console.log(contextService)
  }

  beforeInsert(event: InsertEvent<any>) {
    const userId = this.contextService.getUserId();
    if (userId) {
      if ('createdBy' in event.entity) {
        event.entity.createdBy = userId;
      }
      if ('updatedBy' in event.entity) {
        event.entity.updatedBy = userId;
      }
    }
  }

  beforeUpdate(event: UpdateEvent<any>) {
    const userId = this.contextService.getUserId();
    if (userId && event.entity) {
      if ('updatedBy' in event.entity) {
        event.entity.updatedBy = userId;
      }
    }
  }
}
