import express from 'express';
import type { Request, Response } from 'express';
import orderRoute from './order.route';

const indexRouter = express.Router();

indexRouter.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express with TypeScript!');
});

// Order routes
indexRouter.use('/orders', orderRoute);

export default indexRouter;