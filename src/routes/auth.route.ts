import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authenticateToken from '../middlewares/authMiddleware';
import authorizeRoles from '../middlewares/authorizationMiddleware';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

const authRouter = Router();

authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, name, password, role, companyId } = req.body;

    if (!email || !name || !password || !companyId || !Object.values(Role).includes(role)) {
      res.status(400).json({ message: '이메일, 이름, 비밀번호, 회사 ID, 유효한 역할을 모두 입력해야 합니다.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingCompany = await prisma.company.findUnique({
      where: { id: parseInt(companyId, 10) },
    });

    if (!existingCompany) {
      res.status(400).json({ message: '유효하지 않은 회사 ID입니다.' });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role as Role,
        companyId: parseInt(companyId, 10),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
      },
    });

    console.log(`새 사용자 등록: ${newUser.email} (${newUser.role})`);
    res.status(201).json({ message: '사용자가 성공적으로 등록되었습니다.', user: newUser });
    return;
  } catch (error) {
    console.error('사용자 등록 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    return;
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

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

    console.log(`사용자 로그인 성공: ${user.email} (${user.role})`);
    res.status(200).json({ accessToken });
    return;
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    return;
  }
});

authRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
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

authRouter.get('/moderated-content', authenticateToken, authorizeRoles('ADMIN', 'USER', 'SUPER_ADMIN'), (req: Request, res: Response) => {
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
