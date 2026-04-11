import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import type { IEmailVerificationRepository } from "../../../domain/repositories/IEmailVerificationRepository";
import type { IEmailService } from "../../../domain/services/IEmailService";
import { sendVerificationEmail } from "./SendVerificationEmail";
import { ValidationError, NotFoundError } from "../../../presentation/errors";

type Deps = {
  userRepo: IUserRepository;
  emailVerificationRepo: IEmailVerificationRepository;
  emailService: IEmailService;
};

export async function resendVerificationEmail(deps: Deps, userId: string) {
  const user = await deps.userRepo.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (user.emailVerifiedAt) {
    throw new ValidationError("Email is already verified");
  }

  await sendVerificationEmail(
    { emailVerificationRepo: deps.emailVerificationRepo, emailService: deps.emailService },
    userId,
    user.email
  );
}
