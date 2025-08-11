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
 *     summary: 새 초대 생성 및 이메일 발송
 *     description: SUPER_ADMIN 이 회사에 새 사용자를 초대하고 지정된 역할(SUPER_ADMIN 제외)을 부여합니다.
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
 *               - invitedById
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user1@example.com
 *               name:
 *                 type: string
 *                 example: 박사용
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 example: USER
 *               companyId:
 *                 type: string
 *                 example: 5f1d7c2b-1234-4abc-9def-111111111111
 *               invitedById:
 *                 type: string
 *               expiresInDays:
 *                 type: number
 *                 example: 7
 *     responses:
 *       201:
 *         description: 초대 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invite:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: 잘못된 요청(필수값 누락 등)
 *       403:
 *         description: 권한 없음 (SUPER_ADMIN 전용)
 *       404:
 *         description: 회사 또는 초대한 사용자 없음
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
 *     tags: [Invite]
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *         description: 초대 고유 ID
 *     responses:
 *       200:
 *         description: 초대 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invite:
 *                   type: object
 *                 message:
 *                   type: string
 *       404:
 *         description: 초대 정보 없음
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
