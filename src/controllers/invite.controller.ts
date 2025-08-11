import { RequestHandler } from "express";
import { TInviteIdParamsDto, TCreateInviteRequestDto } from "../dtos/invite.dto";
import { Role } from "@prisma/client";
import inviteService from "../services/invite.service";

/**
 * @swagger
 * tags:
 *   - name: Invite
 *     description: 사용자 초대 관련 엔드포인트
 */

/**
 * @swagger
 * /invite:
 *   post:
 *     summary: 초대 링크 생성 및 이메일 발송
 *     description: SUPER_ADMIN이 회사에 새 사용자를 초대하고 지정된 역할(SUPER_ADMIN 제외)을 부여합니다. 초대 이메일이 자동으로 발송됩니다.
 *     tags: [Invite]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - role
 *               - companyId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 초대할 사용자의 이메일 주소
 *                 example: "user1@example.com"
 *               name:
 *                 type: string
 *                 description: 초대할 사용자의 이름
 *                 example: "박사용"
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 description: 부여할 사용자 역할 (SUPER_ADMIN은 제외)
 *                 example: "USER"
 *               companyId:
 *                 type: integer
 *                 description: 초대할 회사 ID
 *                 example: 1
 *               expiresInDays:
 *                 type: integer
 *                 description: 초대 링크 유효 기간 (일 단위, 기본값 7일)
 *                 example: 7
 *                 default: 7
 *     responses:
 *       201:
 *         description: 초대 생성 및 이메일 발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invite:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "user1@example.com"
 *                     name:
 *                       type: string
 *                       example: "박사용"
 *                     companyId:
 *                       type: integer
 *                       example: 1
 *                     role:
 *                       type: string
 *                       enum: [USER, ADMIN]
 *                       example: "USER"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-16T10:30:00.000Z"
 *                     isUsed:
 *                       type: boolean
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "초대 이메일이 성공적으로 발송되었습니다."
 *       400:
 *         description: 잘못된 요청 (필수값 누락, 잘못된 이메일 형식 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "이미 존재하는 이메일입니다."
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "유효하지 않은 토큰입니다."
 *       403:
 *         description: 권한 없음 (SUPER_ADMIN 전용)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SUPER_ADMIN 권한이 필요합니다."
 *       404:
 *         description: 회사 또는 초대한 사용자 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회사를 찾을 수 없습니다."
 *       500:
 *         description: 서버 오류 (이메일 발송 실패 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "이메일 발송 중 오류가 발생했습니다."
 */
const createInvite: RequestHandler<{}, any, TCreateInviteRequestDto> = async (req, res, next) => {
  try {
    const result = await inviteService.createInvite(req.body, req.protocol, process.env.SIGNUP_HOST);
    res.status(201).json(result);
  } catch (error) {
    console.error("[초대 생성 오류]", error);
    next(error);
  }
};

/**
 * @swagger
 * /invite/{inviteId}:
 *   get:
 *     summary: 초대 정보 조회
 *     description: 초대 ID를 통해 초대 정보를 조회합니다. 초대 링크를 클릭했을 때 사용됩니다.
 *     tags: [Invite]
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 초대 고유 ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: 초대 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invite:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "user1@example.com"
 *                     name:
 *                       type: string
 *                       example: "박사용"
 *                     companyId:
 *                       type: integer
 *                       example: 1
 *                     role:
 *                       type: string
 *                       enum: [USER, ADMIN]
 *                       example: "USER"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-16T10:30:00.000Z"
 *                     isUsed:
 *                       type: boolean
 *                       example: false
 *                     company:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "스낵컴퍼니"
 *                         bizNumber:
 *                           type: string
 *                           example: "123-45-67890"
 *                 message:
 *                   type: string
 *                   example: "초대 정보를 성공적으로 조회했습니다."
 *       404:
 *         description: 초대 정보 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "유효하지 않은 초대 링크입니다."
 *       410:
 *         description: 초대 링크 만료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "초대 링크가 만료되었습니다."
 */
const getInviteInfo: RequestHandler<TInviteIdParamsDto> = async (req, res, next) => {
  const inviteId = req.params.inviteId;
  try {
    const result = await inviteService.getInviteInfo(inviteId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default { createInvite, getInviteInfo };
