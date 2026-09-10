import '@shared/load-env';
import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import { Container } from 'typescript-ioc';

import { RouterService } from '@api/routes/router.service';

import { LoggerService } from '@shared/logger/logger.service';

const app = express();
const port = Number(process.env.APP_PORT) || 3019;
const loggerService = Container.get(LoggerService);

app.use(cors());
app.use(express.json());

Container
  .get(RouterService)
  .set(app);

const httpServer = app.listen(port, () => {
  loggerService.info('Server', `Сервер запущен на порту ${port}`);
});

httpServer.on('error', error => {
  loggerService.error('Server', error);
  process.exit(1);
});

const shutdown = () => {
  httpServer.closeAllConnections();
  httpServer.close(() => process.exit(0));
};

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
