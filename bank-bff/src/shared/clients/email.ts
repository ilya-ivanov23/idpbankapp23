import { Resend } from 'resend';
import { env } from '../../config/env';

export const resendClient = new Resend(env.RESEND_API_KEY);

export const sendOtpEmail = async (to: string, otp: string) => {
  try {
    const data = await resendClient.emails.send({
      from: 'IDPBank Security <auth@idpbank.app>', // Use onboarding@resend.dev for testing unless domain is verified
      to: to,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333;">Verification Required</h2>
          <p>Please use the following 6-digit code to verify your identity. This code will expire in 5 minutes.</p>
          <div style="font-size: 24px; font-weight: bold; padding: 10px; background: #f4f4f4; text-align: center; border-radius: 4px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #777; margin-top: 20px;">If you did not request this code, please ignore this email.</p>
        </div>
      `
    });
    return data;
  } catch (error) {
    console.error('Error sending OTP email via Resend:', error);
    throw error;
  }
};
