import { RequestHandler } from "express";
import { TInviteIdParamsDto } from "../dtos/invite.dto";
import inviteService from "../services/invite.service";

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

export default { getInviteInfo };
