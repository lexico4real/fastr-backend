import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationService } from './notification.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard())
@ApiBearerAuth('token')
@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async send(@Body() dto: SendNotificationDto) {
    await this.notificationService.sendNotification(dto);
    return { message: 'Notification sent successfully' };
  }
}
