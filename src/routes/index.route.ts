import { Router, Request, Response } from 'express';
import authRouter from './auth.route';

const indexRouter = Router();

// 기본 라우트
indexRouter.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express with TypeScript!');
});

indexRouter.use('/auth', authRouter);

export default indexRouter;
