import { Router, Request, Response, NextFunction } from "express";
import { BadRequestError, ValidationError, NotFoundError } from "../types/error";
import prisma from "../config/prisma";
import inviteController from "../controllers/invite.controller";
import inviteService from "../services/invite.service";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import authenticateToken from "../middlewares/jwtAuth.middleware";

const inviteRouter = Router();

inviteRouter.post(
  "/",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, role, companyId, invitedById, expiresInDays } = req.body;

      if (!email || !name || !role || !companyId || !invitedById) {
        throw new BadRequestError("이메일, 이름, 역할, 회사 ID, 초대자 ID는 필수 입력값입니다.");
      }

      const validRoles = ["USER", "ADMIN", "SUPER_ADMIN"];
      if (!validRoles.includes(role)) {
        throw new ValidationError(`유효하지 않은 역할입니다. 허용된 역할: ${validRoles.join(", ")}`);
      }

      const existingCompany = await prisma.company.findUnique({ where: { id: companyId } });
      if (!existingCompany) {
        throw new NotFoundError("존재하지 않는 회사 ID입니다.");
      }
      const invitingUser = await prisma.user.findUnique({ where: { id: invitedById } });
      if (!invitingUser) {
        throw new NotFoundError("존재하지 않는 초대자 ID입니다.");
      }

      const days = expiresInDays && typeof expiresInDays === "number" ? expiresInDays : 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const existingActiveInvite = await prisma.invite.findFirst({
        where: {
          email: email,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      // 기존 활성 초대가 있으면 삭제
      if (existingActiveInvite) {
        await prisma.invite.delete({
          where: { id: existingActiveInvite.id },
        });
        console.log(`[기존 초대 삭제] 이메일: ${email}, 초대 ID: ${existingActiveInvite.id}`);
      }

      const newInvite = await prisma.$transaction(async (prismaTransaction) => {
        return prismaTransaction.invite.create({
          data: {
            email,
            name,
            role,
            companyId,
            invitedById,
            expiresAt,
            isUsed: false,
          },
        });
      });

      const inviteLink = `${req.protocol}://${process.env.SIGNUP_HOST || "localhost:3000"}/signup/${newInvite.id}`;

      // 이메일 발송
      try {
        await inviteService.sendInviteEmail(email, name, inviteLink, role, newInvite.expiresAt);
        console.log(`[초대 생성 및 이메일 발송 성공] 이메일: ${email}, 초대 ID: ${newInvite.id}`);
        res.status(201).json({
          message: "초대 링크가 성공적으로 생성되었고 이메일이 발송되었습니다.",
          inviteId: newInvite.id,
          inviteLink: inviteLink,
          expiresAt: newInvite.expiresAt,
          emailSent: true,
        });
      } catch (emailError) {
        console.error("[이메일 발송 실패]", emailError);
        // 이메일 발송이 실패해도 초대는 생성되었으므로 성공 응답
        res.status(201).json({
          message: "초대 링크가 생성되었지만 이메일 발송에 실패했습니다.",
          inviteId: newInvite.id,
          inviteLink: inviteLink,
          expiresAt: newInvite.expiresAt,
          emailSent: false,
          emailError: "이메일 발송에 실패했습니다.",
        });
      }
    } catch (error) {
      console.error("[초대 생성 오류]", error);
      next(error);
    }
  },
);

inviteRouter.get("/:inviteId", inviteController.getInviteInfo);
export default inviteRouter;
