import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AuthRepository } from '../repositories/auth.repository';
import HttpError from '../utils/HttpError';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your_very_strong_and_secret_jwt_key_please_change_this_in_production';
const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET || 'your_very_strong_and_secret_refresh_jwt_key_please_change_this_in_production';

if (JWT_SECRET === 'your_very_strong_and_secret_jwt_key_please_change_this_in_production') {
  console.warn('[경고]: JWT_SECRET 환경 변수가 설정되지 않았거나 기본값이 사용되고 있습니다. 프로덕션 환경에서는 반드시 변경하세요!');
}
if (REFRESH_TOKEN_SECRET === 'your_very_strong_and_secret_refresh_jwt_key_please_change_this_in_production') {
  console.warn('[경고]: REFRESH_TOKEN_SECRET 환경 변수가 설정되지 않았거나 기본값이 사용되고 있습니다. 프로덕션 환경에서는 반드시 변경하세요!');
}

export class AuthService {
  /**
   * 최고 관리자(SUPER_ADMIN) 회원가입 로직을 처리합니다.
   * 새로운 회사를 생성하고 해당 회사의 최고 관리자로 유저를 등록합니다.
   * @param data - 회원가입에 필요한 데이터 (이메일, 이름, 비밀번호, 회사 이름, 사업자 등록 번호)
   * @returns 생성된 사용자 및 회사 정보
   * @throws {HttpError} - 이메일/사업자 등록 번호 중복 시
   */
  static async signUpSuperAdmin(data: { email: string; name: string; password: string; companyName: string; bizNumber: string }) {
    const { email, name, password, companyName, bizNumber } = data;

    const existingUser = await AuthRepository.findUserByEmailWithCompany(email);
    if (existingUser) {
      throw new HttpError('이미 존재하는 이메일입니다.', 409);
    }

    const existingCompanyByBizNumber = await AuthRepository.findCompanyByBizNumber(bizNumber);
    if (existingCompanyByBizNumber) {
      throw new HttpError('이미 등록된 사업자 등록 번호입니다.', 409);
    }

    const transactionResult = await AuthRepository.runInTransaction(async (prismaTransaction) => {
      const createdCompany = await AuthRepository.createCompany({ name: companyName, bizNumber }, prismaTransaction);
      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUser = await AuthRepository.createUser({
        email,
        name,
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        companyId: createdCompany.id,
      }, prismaTransaction);
      return { company: createdCompany, user: createdUser };
    });

    return transactionResult;
  }

  /**
   * 초대 링크를 통한 사용자 회원가입 로직을 처리합니다.
   * @param inviteId - 초대 링크의 고유 ID
   * @param password - 사용자 비밀번호
   * @returns 생성된 사용자 정보
   * @throws {HttpError} - 유효하지 않거나 만료된 초대, 이미 사용된 초대, 이메일 중복 시
   */
  static async signUpViaInvite(inviteId: string, password: string) {
    const invite = await AuthRepository.findInviteById(inviteId);

    if (!invite) {
      throw new HttpError('유효하지 않은 초대 링크입니다.', 404);
    }
    if (invite.isUsed) {
      throw new HttpError('이미 사용된 초대 링크입니다.', 409);
    }
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      throw new HttpError('만료된 초대 링크입니다.', 410);
    }

    const existingUser = await AuthRepository.findUserByEmailWithCompany(invite.email);
    if (existingUser) {
      await AuthRepository.runInTransaction(async (prismaTransaction) => {
        await AuthRepository.updateInviteToUsed(inviteId, prismaTransaction);
      });
      console.log(`[초대 회원가입 오류] 이미 존재하는 사용자: ${invite.email} (초대 링크 사용 완료 처리)`);
      throw new HttpError('이미 가입된 이메일입니다. 초대 링크가 사용 완료 처리되었습니다.', 409); // 또는 200 응답으로 변경 가능
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await AuthRepository.runInTransaction(async (prismaTransaction) => {
      const user = await AuthRepository.createUser({
        email: invite.email,
        name: invite.name,
        password: hashedPassword,
        role: invite.role,
        companyId: invite.companyId,
      }, prismaTransaction);
      await AuthRepository.updateInviteToUsed(inviteId, prismaTransaction);
      return user;
    });

    return newUser;
  }

  /**
   * 사용자 로그인 로직을 처리합니다.
   * @param email - 사용자 이메일
   * @param password - 사용자 비밀번호
   * @returns 사용자 정보, 액세스 토큰, 리프레시 토큰
   * @throws {HttpError} - 이메일 또는 비밀번호 불일치 시
   */
  static async login(email: string, password_plain: string) {
    const user = await AuthRepository.findUserByEmailWithCompany(email);

    if (!user) {
      throw new HttpError('잘못된 이메일 또는 비밀번호입니다.', 400);
    }

    const isPasswordValid = await bcrypt.compare(password_plain, user.password);
    if (!isPasswordValid) {
      throw new HttpError('잘못된 이메일 또는 비밀번호입니다.', 400);
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await AuthRepository.updateUserRefreshToken(user.id, hashedRefreshToken);

    return { user, accessToken, refreshToken };
  }

  /**
   * Access Token 갱신 로직을 처리합니다.
   * @param currentRefreshToken - 현재 사용자의 리프레시 토큰
   * @returns 새로운 Access Token 및 Refresh Token
   * @throws {HttpError} - Refresh Token이 없거나 유효하지 않거나 만료된 경우
   */
  static async refreshAccessToken(currentRefreshToken: string) {
    let decoded: { id: string; iat: number; exp: number }; // id는 string으로 변경
    try {
      decoded = jwt.verify(currentRefreshToken, REFRESH_TOKEN_SECRET) as { id: string; iat: number; exp: number };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new HttpError('리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new HttpError('유효하지 않은 리프레시 토큰입니다. 다시 로그인해주세요.', 403);
      } else {
        console.error('[리프레시 토큰 검증 오류]', error);
        throw new HttpError('리프레시 토큰 검증 중 알 수 없는 오류가 발생했습니다.', 500);
      }
    }

    const user = await AuthRepository.findUserById(decoded.id);

    if (!user || !user.hashedRefreshToken) {
      throw new HttpError('사용자 또는 유효한 리프레시 토큰을 찾을 수 없습니다. 다시 로그인해주세요.', 401);
    }

    const isRefreshTokenValid = await bcrypt.compare(currentRefreshToken, user.hashedRefreshToken);
    if (!isRefreshTokenValid) {
      await AuthRepository.updateUserRefreshToken(user.id, null);
      throw new HttpError('유효하지 않거나 이미 사용된 리프레시 토큰입니다. 다시 로그인해주세요.', 403);
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    const newHashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await AuthRepository.updateUserRefreshToken(user.id, newHashedRefreshToken);

    return { newAccessToken, newRefreshToken, user };
  }

  /**
   * 사용자 로그아웃 로직을 처리합니다.
   * @param userId - 로그아웃할 사용자의 ID
   * @throws {HttpError} - 로그아웃 처리 중 오류 발생 시
   */
  static async logout(userId: string) {
    await AuthRepository.updateUserRefreshToken(userId, null);
  }
}