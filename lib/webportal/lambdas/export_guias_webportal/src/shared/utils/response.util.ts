import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponseDto } from '../dto/api-response.dto';

export class ResponseUtil {
  static success<T>(
    data: T,
    message?: string,
  ): ApiResponseDto<T> {
    return ApiResponseDto.success(data, message);
  }

  static error(
    error: string | Error,
    message?: string,
  ): ApiResponseDto {
    const errorMessage = error instanceof Error ? error.message : error;
    return ApiResponseDto.error(errorMessage, message);
  }

  static badRequest(message: string = 'Bad Request'): HttpException {
    return new HttpException(
      ResponseUtil.error(message, 'Solicitud inválida'),
      HttpStatus.BAD_REQUEST,
    );
  }

  static notFound(message: string = 'Not Found'): HttpException {
    return new HttpException(
      ResponseUtil.error(message, 'Recurso no encontrado'),
      HttpStatus.NOT_FOUND,
    );
  }

  static internalError(error: string | Error): HttpException {
    return new HttpException(
      ResponseUtil.error(error, 'Error interno del servidor'),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static unauthorized(message: string = 'Unauthorized'): HttpException {
    return new HttpException(
      ResponseUtil.error(message, 'No autorizado'),
      HttpStatus.UNAUTHORIZED,
    );
  }

  static forbidden(message: string = 'Forbidden'): HttpException {
    return new HttpException(
      ResponseUtil.error(message, 'Acceso denegado'),
      HttpStatus.FORBIDDEN,
    );
  }
}
