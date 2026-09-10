/**
 * HTTP-ошибка домена. Через BullMQ waitUntilFinished до API доходит
 * только message, поэтому статус кладём в него: `400:текст`.
 */
export class AppHttpError extends Error {
  public readonly statusCode: number;

  public readonly clientMessage: string;

  constructor(statusCode: number, clientMessage: string) {
    super(`${statusCode}:${clientMessage}`);
    this.name = 'AppHttpError';
    this.statusCode = statusCode;
    this.clientMessage = clientMessage;
  }

  /**
   * Собирает ошибку из инстанса или из `failedReason` очереди
   * @param error - catch
   */
  public static fromCaught = (error: unknown): AppHttpError | null => {
    if (error instanceof AppHttpError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const match = /^(\d{3}):([\s\S]*)$/.exec(message);
    if (!match) {
      return null;
    }

    return new AppHttpError(Number(match[1]), match[2]);
  };
}
