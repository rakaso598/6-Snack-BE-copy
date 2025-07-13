import { Request } from "express";
import { Prisma } from "@prisma/client";

export type TAuthenticatedRequest = Request & {
  user?: Prisma.UserGetPayload<{ include: { company: true } }>;
};
