import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ErrorHandlerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.send;
    res.send = function (body) {
      if (body && typeof body === 'object' && body.error) {
        const status = body.status || HttpStatus.INTERNAL_SERVER_ERROR;
        return originalSend.call(this, body);
      }
      return originalSend.call(this, body);
    };
    next();
  }
}
