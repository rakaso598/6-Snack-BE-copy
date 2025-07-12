import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { BadRequestError, ValidationError } from '../types/error';

export class AuthController {
  /**
   * 최고 관리자(SUPER_ADMIN) 회원가입
   */
  static async signUpSuperAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, password, confirmPassword, role, companyName, bizNumber } = req.body;

      if (!email || !name || !password || !confirmPassword || !companyName || !bizNumber) {
        throw new BadRequestError('이메일, 이름, 비밀번호, 비밀번호 확인, 회사 이름, 사업자 등록 번호를 모두 입력해야 합니다.');
      }
      if (password !== confirmPassword) {
        throw new ValidationError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      }
      if (role && role !== Role.SUPER_ADMIN) {
        throw new ValidationError('이 엔드포인트는 최고 관리자(SUPER_ADMIN) 회원가입 전용입니다. 역할은 SUPER_ADMIN이어야 합니다.');
      }

      const transactionResult = await AuthService.signUpSuperAdmin({ email, name, password, companyName, bizNumber });

      const newUser = transactionResult.user;
      const registeredCompany = transactionResult.company;
      const monthlyBudget = transactionResult.monthlyBudget;

      console.log(`[회원가입 성공] 새 SUPER_ADMIN 사용자: ${newUser.email}, 회사: ${registeredCompany.name}, 예산 생성: ${monthlyBudget.year}년 ${monthlyBudget.month}월`);

      res.status(201).json({
        message: '최고 관리자 회원가입이 성공적으로 등록되었습니다.',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
        company: {
          id: registeredCompany.id,
          name: registeredCompany.name,
        },
        monthlyBudget: {
          id: monthlyBudget.id,
          year: monthlyBudget.year,
          month: monthlyBudget.month,
          currentMonthExpense: monthlyBudget.currentMonthExpense,
          currentMonthBudget: monthlyBudget.currentMonthBudget,
          monthlyBudget: monthlyBudget.monthlyBudget,
        },
      });

    } catch (error) {
      console.error('[회원가입 오류]', error);
      next(error);
    }
  }

  /**
   * 초대 링크를 통한 사용자 회원가입
   */
  static async signUpViaInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { inviteId } = req.params;
      const { password, confirmPassword } = req.body;

      if (!password || !confirmPassword) {
        throw new BadRequestError('비밀번호와 비밀번호 확인을 모두 입력해야 합니다.');
      }
      if (password !== confirmPassword) {
        throw new ValidationError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      }

      const newUser = await AuthService.signUpViaInvite(inviteId, password);

      console.log(`[초대 회원가입 성공] 새 사용자: ${newUser.email} (${newUser.role})`);

      res.status(201).json({
        message: '회원가입이 성공적으로 완료되었습니다.',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });

    } catch (error) {
      console.error('[초대 회원가입 오류]', error);
      next(error);
    }
  }

  /**
   * 사용자 로그인
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('이메일과 비밀번호를 모두 입력해야 합니다.');
      }

      const { user, accessToken, refreshToken } = await AuthService.login(email, password);

      const accessTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: accessTokenExpires,
        path: '/',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: refreshTokenExpires,
        path: '/',
      });

      console.log(`[로그인 성공] 사용자: ${user.email} (${user.role}), 회사: ${user.company.name})`);
      res.status(200).json({
        message: '로그인이 성공적으로 처리 되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: {
            id: user.company.id,
            name: user.company.name,
          },
        },
      });

    } catch (error) {
      console.error('[로그인 오류]', error);
      next(error);
    }
  }

  /**
   * Access Token 갱신
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new BadRequestError('리프레시 토큰이 제공되지 않았습니다. 다시 로그인해주세요.');
      }

      const { newAccessToken, newRefreshToken, user } = await AuthService.refreshAccessToken(refreshToken);

      const newAccessTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      const newRefreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: newAccessTokenExpires,
        path: '/',
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: newRefreshTokenExpires,
        path: '/',
      });

      console.log(`[토큰 갱신 성공] 사용자: ${user.email}`);
      res.status(200).json({ message: '새로운 Access Token이 발급되었습니다.' });
    } catch (error) {
      console.error('[토큰 갱신 오류]', error);
      next(error);
    }
  }

  /**
   * 사용자 로그아웃
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('인증되지 않은 사용자입니다.');
      }

      await AuthService.logout(req.user.id);

      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      console.log(`[로그아웃 성공] 사용자: ${req.user.email}`);
      res.status(200).json({ message: '성공적으로 로그아웃되었습니다.' });
    } catch (error) {
      console.error('[로그아웃 오류]', error);
      next(error);
    }
  }
} 