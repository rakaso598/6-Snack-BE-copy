declare namespace Express {
  export interface Request {
    user?: UserPayload;
  }
}

interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  iat: number;
  exp: number;
}