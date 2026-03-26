import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface GqlContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: any & { user?: JwtPayload };
}
