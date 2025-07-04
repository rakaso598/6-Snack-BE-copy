import express from 'express';
import type { Application, Request, Response } from 'express';

const indexRouter: Application = express();

indexRouter.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express with TypeScript!');
});

export default indexRouter;