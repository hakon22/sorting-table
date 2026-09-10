import { Singleton } from 'typescript-ioc';

/** Параметры Redis для BullMQ */
export interface RedisConnectionInterface {
  host: string;
  port: number;
}

/** connection + prefix для Queue / Worker / QueueEvents */
export interface BullMqConnectionOptionsInterface {
  connection: RedisConnectionInterface;
  prefix: string;
}

@Singleton
export class RedisConnectionService {
  /**
   * Префикс ключей на общем Redis: APP_NAME:NODE_ENV
   */
  public getPrefix = (): string => {
    const appName = process.env.APP_NAME || 'sorting-table';
    const nodeEnv = process.env.NODE_ENV || 'development';
    return `${appName}:${nodeEnv}`.toUpperCase();
  };

  /**
   * В контейнере `localhost` — сам контейнер, а не хост с Redis.
   * `docker-compose.dev.yml` задаёт `host.docker.internal` через `extra_hosts`.
   * Prod (`network_mode: host`) IS_DOCKER не ставит — localhost остаётся хостом.
   */
  private resolveHost = (): string => {
    const host = process.env.REDIS_HOST?.trim() || 'localhost';
    if (process.env.IS_DOCKER === 'TRUE' && (host === 'localhost' || host === '127.0.0.1')) {
      return 'host.docker.internal';
    }
    return host;
  };

  /**
   * Подключение к Redis на хосте VPS / localhost
   */
  public getConnection = (): RedisConnectionInterface => {
    return {
      host: this.resolveHost(),
      port: Number(process.env.REDIS_PORT) || 6379,
    };
  };

  /**
   * Общие опции BullMQ
   */
  public getBullMqOptions = (): BullMqConnectionOptionsInterface => {
    return {
      connection: this.getConnection(),
      prefix: this.getPrefix(),
    };
  };
}
