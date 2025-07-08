import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import authenticateToken from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your_very_strong_and_secret_jwt_key_please_change_this_in_production';
if (JWT_SECRET === 'your_very_strong_and_secret_jwt_key_please_change_this_in_production') {
  console.warn('[경고]: JWT_SECRET 환경 변수가 설정되지 않았거나 기본값이 사용되고 있습니다. 프로덕션 환경에서는 반드시 변경하세요!');
}

const authRouter = Router();

class HttpError extends Error {
  public status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

authRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password, role, companyId } = req.body;

    const isValidRole = Object.values(Role).includes(role as Role);

    if (!email || !name || !password || companyId === undefined || !isValidRole) {
      throw new HttpError('이메일, 이름, 비밀번호, 회사 ID, 유효한 역할을 모두 입력해야 합니다.', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new HttpError('이미 존재하는 이메일입니다.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const parsedCompanyId = parseInt(companyId, 10);
    if (isNaN(parsedCompanyId)) {
      throw new HttpError('유효하지 않은 회사 ID 형식입니다.', 400);
    }
    const existingCompany = await prisma.company.findUnique({
      where: { id: parsedCompanyId },
    });

    if (!existingCompany) {
      throw new HttpError('유효하지 않은 회사 ID입니다.', 400);
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role as Role,
        companyId: parsedCompanyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
      },
    });

    console.log(`[회원가입 성공] 새 사용자: ${newUser.email} (${newUser.role})`);
    res.status(201).json({ message: '사용자가 성공적으로 등록되었습니다.', user: newUser });
  } catch (error) {
    console.error('[회원가입 오류]', error);
    next(error);
  }
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpError('잘못된 이메일 또는 비밀번호입니다.', 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpError('잘못된 이메일 또는 비밀번호입니다.', 400);
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`[로그인 성공] 사용자: ${user.email} (${user.role})`);
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error('[로그인 오류]', error);
    next(error);
  }
});

authRouter.get('/me', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new HttpError('사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', 401));
  }

  res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    }
  });
});

export default authRouter;