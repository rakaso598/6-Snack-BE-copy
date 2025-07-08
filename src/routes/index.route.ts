import { Router, Request, Response } from 'express';
import authRouter from './auth.route';

const indexRouter = Router();

indexRouter.get('/', (req, res) => {
  res.send('Welcome to Express with TypeScript!');
});

indexRouter.use('/auth', authRouter);

export default indexRouter;
