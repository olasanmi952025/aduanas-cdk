import { HttpException } from '@nestjs/common';
import { ApiResponseDto } from '../dto/api-response.dto';
export declare class ResponseUtil {
    static success<T>(data: T, message?: string): ApiResponseDto<T>;
    static error(error: string | Error, message?: string): ApiResponseDto;
    static badRequest(message?: string): HttpException;
    static notFound(message?: string): HttpException;
    static internalError(error: string | Error): HttpException;
    static unauthorized(message?: string): HttpException;
    static forbidden(message?: string): HttpException;
}
