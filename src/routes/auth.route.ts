import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authenticateToken from '../middlewares/authMiddleware';
import authorizeRoles from '../middlewares/authorizationMiddleware';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      name: string;
      role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    }
    interface Request {
      user?: UserPayload;
    }
  }
}

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const users: User[] = [];

const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password, role, companyId } = req.body;
    if (!email || !name || !password || !companyId) {
      res.status(400).json({ message: '이메일, 이름, 비밀번호, 회사 ID를 모두 입력해야 합니다.' });
      return;
    }
    if (users.find(u => u.email === email)) {
      res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      role: role || 'USER',
      companyId: parseInt(companyId, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(newUser);
    res.status(201).json({ message: '사용자가 성공적으로 등록되었습니다.', user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } });
    return;
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    return;
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) {
      res.status(400).json({ message: '잘못된 이메일 또는 비밀번호입니다.' });
      return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: '잘못된 이메일 또는 비밀번호입니다.' });
      return;
    }
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
    res.status(200).json({ accessToken });
    return;
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    return;
  }
});

authRouter.get('/profile', authenticateToken, (req: Request, res: Response) => {
  res.json({
    message: '환영합니다, 인증된 사용자님!',
    user: {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role
    }
  });
  return;
});

authRouter.get('/admin-dashboard', authenticateToken, authorizeRoles('ADMIN'), (req: Request, res: Response) => {
  res.json({
    message: '관리자 대시보드에 오신 것을 환영합니다.',
    user: {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role
    }
  });
  return;
});

authRouter.get('/moderated-content', authenticateToken, authorizeRoles('ADMIN', 'USER'), (req: Request, res: Response) => {
  res.json({
    message: '검토된 콘텐츠 페이지입니다.',
    user: {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role
    }
  });
  return;
});

export default authRouter;
