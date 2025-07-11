import { RequestHandler } from "express";
import { TUserIdParamsDto } from "../dtos/user.dto";
import { TUpdateCompanyInfoDto } from "../dtos/company.dto";
import companyService from "../services/company.service";

const updateCompanyInfo: RequestHandler<TUserIdParamsDto, any, TUpdateCompanyInfoDto> = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const companyId = req.user?.company.id;
    const currentUser = req.user!;

    if (!companyId) {
      res.status(400).json({ message: "회사 아이디가 존재하지 않습니다." });
      return;
    }

    const result = await companyService.updateCompanyInfo(userId, req.body, currentUser, companyId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default { updateCompanyInfo };
