export class ApiResponseDto<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: string;
  timestamp: string;

  constructor(
    success: boolean,
    data: T | null = null,
    message?: string,
    error?: string,
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message);
  }

  static error(error: string, message?: string): ApiResponseDto {
    return new ApiResponseDto(false, null, message, error);
  }
}
