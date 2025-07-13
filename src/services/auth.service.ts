import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role, Prisma } from '@prisma/client';
import authRepository from '../repositories/auth.repository';
import { BadRequestError, AuthenticationError, NotFoundError, ValidationError } from '../types/error';
import { getCurrentYearAndMonth, isExpired } from '../utils/date.utils';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your_very_strong_and_secret_jwt_key_please_change_this_in_production';

export class AuthService {
  /**
   * 최고 관리자 회원가입
   */
  static async signUpSuperAdmin(data: {
    email: string;
    name: string;
    password: string;
    companyName: string;
    bizNumber: string;
  }) {
    // 이메일 중복 확인
    const existingUser = await authRepository.findUserByEmailWithCompany(data.email);
    if (existingUser) {
      throw new ValidationError('이미 등록된 이메일입니다.');
    }

    // 사업자 등록 번호 중복 확인
    const existingCompany = await authRepository.findCompanyByBizNumber(data.bizNumber);
    if (existingCompany) {
      throw new ValidationError('이미 등록된 사업자 등록 번호입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const transactionResult = await authRepository.runInTransaction(async (prismaTransaction) => {
      // 회사 생성
      const createdCompany = await authRepository.createCompany({
        name: data.companyName,
        bizNumber: data.bizNumber,
      }, prismaTransaction);

      // 사용자 생성
      const createdUser = await authRepository.createUser({
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        companyId: createdCompany.id,
      }, prismaTransaction);

      // 현재 년도와 월을 가져와서 월별 예산 생성
      const { currentYear, currentMonth } = getCurrentYearAndMonth();

      const createdMonthlyBudget = await authRepository.createMonthlyBudget({
        companyId: createdCompany.id,
        year: currentYear,
        month: currentMonth,
      }, prismaTransaction);

      return { company: createdCompany, user: createdUser, monthlyBudget: createdMonthlyBudget };
    });

    return transactionResult;
  }

  /**
   * 초대를 통한 회원가입
   */
  static async signUpViaInvite(inviteId: string, password: string) {
    // 초대 정보 조회
    const invite = await authRepository.findInviteById(inviteId);
    if (!invite) {
      throw new NotFoundError('유효하지 않은 초대 링크입니다.');
    }

    if (invite.isUsed) {
      throw new ValidationError('이미 사용된 초대 링크입니다.');
    }

    // 초대 만료 확인
    if (isExpired(invite.expiresAt)) {
      throw new ValidationError('만료된 초대 링크입니다.');
    }

    // 이메일 중복 확인
    const existingUser = await authRepository.findUserByEmailWithCompany(invite.email);
    if (existingUser) {
      throw new ValidationError('이미 등록된 이메일입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await authRepository.runInTransaction(async (prismaTransaction) => {
      // 사용자 생성
      const createdUser = await authRepository.createUser({
        email: invite.email,
        name: invite.name,
        password: hashedPassword,
        role: invite.role,
        companyId: invite.companyId,
      }, prismaTransaction);

      // 초대 상태를 사용 완료로 업데이트
      await authRepository.updateInviteToUsed(inviteId, prismaTransaction);

      return createdUser;
    });

    return newUser;
  }

  /**
   * 로그인
   */
  static async login(email: string, password: string) {
    const user = await authRepository.findUserByEmailWithCompany(email);
    if (!user) {
      throw new AuthenticationError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    // JWT 토큰 생성
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 리프레시 토큰 해시화하여 저장
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await authRepository.updateUserRefreshToken(user.id, hashedRefreshToken);

    return { user, accessToken, refreshToken };
  }

  /**
   * Access Token 갱신
   */
  static async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; email: string };
      const user = await authRepository.findUserById(decoded.userId);

      if (!user || !user.hashedRefreshToken) {
        throw new AuthenticationError('유효하지 않은 리프레시 토큰입니다.');
      }

      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
      if (!isRefreshTokenValid) {
        throw new AuthenticationError('유효하지 않은 리프레시 토큰입니다.');
      }

      // 새로운 토큰 생성
      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // 새로운 리프레시 토큰 해시화하여 저장
      const newHashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      await authRepository.updateUserRefreshToken(user.id, newHashedRefreshToken);

      return { newAccessToken, newRefreshToken, user };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('리프레시 토큰이 만료되었습니다.');
      }
      throw new AuthenticationError('유효하지 않은 리프레시 토큰입니다.');
    }
  }

  /**
   * 로그아웃
   */
  static async logout(userId: string) {
    await authRepository.updateUserRefreshToken(userId, null);
  }
}