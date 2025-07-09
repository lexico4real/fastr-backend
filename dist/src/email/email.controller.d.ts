import { EmailService } from './email.service';
import { SendEmailDto } from './email.dto';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    sendMail(sendEmailDto: SendEmailDto): Promise<any>;
}
