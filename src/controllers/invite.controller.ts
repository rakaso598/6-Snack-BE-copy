import { RequestHandler } from "express";
import { TInviteIdParamsDto, TCreateInviteRequestDto } from "../dtos/invite.dto";
import { Role } from "@prisma/client";
import inviteService from "../services/invite.service";

/**
 * @swagger
 * /invite:
 *   post:
 *     summary: 새 초대 생성 및 이메일 발송
 *     tags: [Invite]
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
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, SUPER_ADMIN]
 *               companyId:
 *                 type: string
 *               invitedById:
 *                 type: string
 *               expiresInDays:
 *                 type: number
 *     responses:
 *       201:
 *         description: 초대 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 회사 또는 사용자 없음
 */
const createInvite: RequestHandler<{}, any, TCreateInviteRequestDto> = async (req, res, next) => {
  try {
    const result = await inviteService.createInvite(
      req.body,
      req.protocol,
      process.env.SIGNUP_HOST
    );
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
 *     responses:
 *       200:
 *         description: 초대 정보 반환
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
