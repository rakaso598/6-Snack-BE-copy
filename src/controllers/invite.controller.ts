import { RequestHandler } from "express";
import { TInviteIdParamsDto } from "../dtos/invite.dto";
import inviteService from "../services/invite.service";

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
