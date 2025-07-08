import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authenticateToken from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';
import { User, Role } from '@prisma/client';

class CustomError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

const authRouter = Router();

authRouter.post('/signup', async (req, res, next) => {
  try {
    const { email, name, password, role, companyId } = req.body;

    if (!email || !name || !password || !companyId || !Object.values(Role).includes(role)) {
      throw new CustomError('이메일, 이름, 비밀번호, 회사 ID, 유효한 역할을 모두 입력해야 합니다.', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new CustomError('이미 존재하는 이메일입니다.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingCompany = await prisma.company.findUnique({
      where: { id: parseInt(companyId, 10) },
    });

    if (!existingCompany) {
      throw new CustomError('유효하지 않은 회사 ID입니다.', 400);
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
  } catch (error) {
    console.error('사용자 등록 중 오류 발생:', error);
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new CustomError('잘못된 이메일 또는 비밀번호입니다.', 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomError('잘못된 이메일 또는 비밀번호입니다.', 400);
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    console.log(`사용자 로그인 성공: ${user.email} (${user.role})`);
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error('로그인 중 오류 발생:', error);
    next(error);
  }
});

authRouter.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role
    }
  });
});

export default authRouter;
