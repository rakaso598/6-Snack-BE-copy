import { Router, Request, Response, NextFunction } from 'express';
import { BadRequestError, ValidationError, NotFoundError } from '../types/error';
import prisma from "../config/prisma";

const inviteRouter = Router();

inviteRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, role, companyId, invitedById, expiresInDays } = req.body;

    if (!email || !name || !role || !companyId || !invitedById) {
      throw new BadRequestError('이메일, 이름, 역할, 회사 ID, 초대자 ID는 필수 입력값입니다.');
    }

    const validRoles = ['USER', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`유효하지 않은 역할입니다. 허용된 역할: ${validRoles.join(', ')}`);
    }

    const existingCompany = await prisma.company.findUnique({ where: { id: companyId } });
    if (!existingCompany) {
      throw new NotFoundError('존재하지 않는 회사 ID입니다.');
    }
    const invitingUser = await prisma.user.findUnique({ where: { id: invitedById } });
    if (!invitingUser) {
      throw new NotFoundError('존재하지 않는 초대자 ID입니다.');
    }

    const days = expiresInDays && typeof expiresInDays === 'number' ? expiresInDays : 7;
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

    if (existingActiveInvite) {
      res.status(200).json({
        message: '해당 이메일로 이미 활성화된 초대 링크가 존재합니다.',
        inviteId: existingActiveInvite.id,
        inviteLink: `${req.protocol}://${req.get('host')}/signup/${existingActiveInvite.id}`,
      });
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

    const inviteLink = `${req.protocol}://${req.get('host')}/signup/${newInvite.id}`;

    console.log(`[초대 생성 성공] 이메일: ${email}, 초대 ID: ${newInvite.id}`);
    res.status(201).json({
      message: '초대 링크가 성공적으로 생성되었습니다.',
      inviteId: newInvite.id,
      inviteLink: inviteLink,
      expiresAt: newInvite.expiresAt,
    });

  } catch (error) {
    console.error('[초대 생성 오류]', error);
    next(error);
  }
});

inviteRouter.get('/:inviteId', InviteController.getInvite)
export default inviteRouter;