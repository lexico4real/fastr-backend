import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SendEmailDto } from './email.dto';

@ApiTags('email')
@UseGuards(AuthGuard())
@ApiBearerAuth('token')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendMail(@Body() sendEmailDto: SendEmailDto) {
    return this.emailService.sendMail(sendEmailDto);
  }
}