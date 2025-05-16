import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { RequestContextService } from 'src/request-context/request-context.service';

@EventSubscriber()
export class BaseEntitySubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>) {
    const userId = RequestContextService.getInstance()?.getUserId();
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
    const userId = RequestContextService.getInstance()?.getUserId();
    if (userId && event.entity) {
      if ('updatedBy' in event.entity) {
        event.entity.updatedBy = userId;
      }
    }
  }
}
