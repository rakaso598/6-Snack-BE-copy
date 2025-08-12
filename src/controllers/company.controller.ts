import { RequestHandler } from "express";
import { TUserIdParamsDto } from "../dtos/user.dto";
import { TUpdateCompanyInfoDto } from "../dtos/company.dto";
import companyService from "../services/company.service";

/**
 * @swagger
 * tags:
 *   - name: Company
 *     description: 회사 정보 관련 엔드포인트
 */
/**
 * @swagger
 * /super-admin/users/{userId}/company:
 *   patch:
 *     summary: (최고관리자) 회사 정보 수정
 *     tags: [Company]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 회사 정보를 수정할 유저 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - newPassword
 *               - newPasswordConfirm
 *             properties:
 *               companyName:
 *                 type: string
 *                 description: 새로운 회사명
 *               newPassword:
 *                 type: string
 *                 description: 새로운 비밀번호
 *               newPasswordConfirm:
 *                 type: string
 *                 description: 새로운 비밀번호 확인
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 회사 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회사 정보가 성공적으로 수정되었습니다."
 *       400:
 *         description: 회사 아이디가 존재하지 않음
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (SUPER_ADMIN만 가능)
 */
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
