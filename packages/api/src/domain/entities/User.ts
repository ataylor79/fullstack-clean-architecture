export interface User {
  id: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}
