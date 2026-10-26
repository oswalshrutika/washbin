import "server-only";

/** Sends login OTPs. Swap MockOtpSender for an SMS/WhatsApp provider (MSG91, Gupshup, Twilio) at launch. */
export interface OtpSender {
  send(phone: string, code: string): Promise<void>;
}

class MockOtpSender implements OtpSender {
  async send(phone: string, code: string) {
    console.info(`[mock-otp] ${phone} → ${code}`);
  }
}

export const otpSender: OtpSender = new MockOtpSender();

/** While the mock sender is in use no SMS goes out, so the OTP is shown on screen (dev and demo deploys). */
export const SHOW_OTP_ON_SCREEN = otpSender instanceof MockOtpSender;
