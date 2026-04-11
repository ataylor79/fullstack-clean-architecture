import type { IEmailService } from "@domain/services/IEmailService";

// In-memory stores used by the no-op service in dev/test.
const capturedTokens = new Map<string, string>();
const capturedResetTokens = new Map<string, string>();

export function getCapturedToken(email: string): string | undefined {
  return capturedTokens.get(email);
}

export function getCapturedResetToken(email: string): string | undefined {
  return capturedResetTokens.get(email);
}

function createNoOpEmailService(): IEmailService {
  return {
    async sendVerificationEmail(to, token) {
      capturedTokens.set(to, token);
    },
    async sendPasswordResetEmail(to, token) {
      capturedResetTokens.set(to, token);
    },
  };
}

function createResendEmailService(): IEmailService {
  return {
    async sendVerificationEmail(to, token) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.APP_URL ?? "http://localhost:5173";

      await resend.emails.send({
        from: `noreply@${process.env.EMAIL_FROM_DOMAIN}`,
        to,
        subject: "Verify your email",
        html: `<p>Click <a href="${appUrl}/auth/verify?token=${token}">here</a> to verify your email.</p>`,
      });
    },
    async sendPasswordResetEmail(to, token) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.APP_URL ?? "http://localhost:5173";

      await resend.emails.send({
        from: `noreply@${process.env.EMAIL_FROM_DOMAIN}`,
        to,
        subject: "Reset your password",
        html: `<p>Click <a href="${appUrl}/auth/reset-password?token=${token}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      });
    },
  };
}

export function createEmailService(): IEmailService {
  if (process.env.NODE_ENV === "production") {
    return createResendEmailService();
  }
  return createNoOpEmailService();
}
