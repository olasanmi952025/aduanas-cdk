export declare class ApiResponseDto<T = any> {
    success: boolean;
    data: T | null;
    message?: string;
    error?: string;
    timestamp: string;
    constructor(success: boolean, data?: T | null, message?: string, error?: string);
    static success<T>(data: T, message?: string): ApiResponseDto<T>;
    static error(error: string, message?: string): ApiResponseDto;
}
