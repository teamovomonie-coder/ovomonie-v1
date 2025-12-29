import { logger } from './logger';

export interface SMSService {
  sendOTP(phone: string, otp: string): Promise<boolean>;
}

class MockSMSService implements SMSService {
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    // Mock SMS sending - in production, integrate with SMS provider like Twilio, Termii, etc.
    logger.info('Mock SMS sent', { phone: phone.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2'), otp });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }
}

// In production, replace with actual SMS service
export const smsService: SMSService = new MockSMSService();