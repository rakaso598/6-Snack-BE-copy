import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Prisma.UserGetPayload<{
        include: { company: true };
      }>;
    }
  }
}