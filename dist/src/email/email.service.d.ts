import { SendEmailDto } from './email.dto';
export declare class EmailService {
    private transporter;
    private logger;
    constructor();
    sendMail(sendEmailDto: SendEmailDto): Promise<any>;
}
