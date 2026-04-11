import type { IEmailService } from "../../domain/services/IEmailService";

function createNoOpEmailService(): IEmailService {
  return {
    async sendVerificationEmail(_to, _token) {
      // No-op in test/dev — token is retrievable directly from the DB
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
  };
}

export function createEmailService(): IEmailService {
  if (process.env.NODE_ENV === "production") {
    return createResendEmailService();
  }
  return createNoOpEmailService();
}
