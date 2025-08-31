export interface NotificationStrategy {
  send(recipient: string, message: string, metadata?: Record<string, any>): Promise<void>;
}
