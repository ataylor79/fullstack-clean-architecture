export interface IPasswordResetRepository {
  create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<{
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  } | null>;
  deleteByUserId(userId: string): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}
