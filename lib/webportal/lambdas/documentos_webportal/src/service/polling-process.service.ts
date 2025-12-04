import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SubmitProcessResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface ProcessStatusResponse {
  jobId: string;
  processType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

@Injectable()
export class PollingProcessService {
  private readonly logger = new Logger(PollingProcessService.name);
  private readonly httpClient: AxiosInstance;
  private readonly pollingApiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.pollingApiUrl = 
      this.configService.get<string>('ZEDMOUS_API_URL') || 
      this.configService.get<string>('POLLING_API_URL') || '';
    
    if (!this.pollingApiUrl) {
      this.logger.warn('ZEDMOUS_API_URL or POLLING_API_URL not configured. Polling process integration will not work.');
    }

    this.httpClient = axios.create({
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Envía un proceso al polling_process usando POST /process
   * @param processType Tipo de proceso (ej: 'manifest.close')
   * @param payload Payload del proceso
   * @returns Respuesta con jobId y estado
   */
  async submitProcess(
    processType: string,
    payload?: any
  ): Promise<SubmitProcessResponse> {
    if (!this.pollingApiUrl) {
      throw new HttpException(
        'ZEDMOUS_API_URL or POLLING_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    try {
      const url = `${this.pollingApiUrl}/process`;
      
      this.logger.log(
        `Submitting process to polling_process: ${processType}`
      );

      const response = await this.httpClient.post<SubmitProcessResponse>(
        url,
        {
          processType,
          payload,
        }
      );

      this.logger.log(
        `Process submitted successfully. JobId: ${response.data.jobId}, Status: ${response.data.status}`
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to submit process to polling_process: ${processType}`,
        error.message
      );

      if (error.response) {
        throw new HttpException(
          `Error submitting process: ${error.response.status} ${error.response.statusText}`,
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      throw new HttpException(
        `Error submitting process: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Consulta el estado de un proceso usando GET /process/:jobId
   * @param jobId ID del job
   * @returns Estado del proceso
   */
  async getProcessStatus(jobId: string): Promise<ProcessStatusResponse> {
    if (!this.pollingApiUrl) {
      throw new HttpException(
        'ZEDMOUS_API_URL or POLLING_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    try {
      const url = `${this.pollingApiUrl}/process/${jobId}`;
      
      const response = await this.httpClient.get<ProcessStatusResponse>(url);

      this.logger.log(
        `Process status retrieved. JobId: ${jobId}, Status: ${response.data.status}`
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new HttpException(
          `Process not found for jobId: ${jobId}`,
          HttpStatus.NOT_FOUND
        );
      }

      this.logger.error(
        `Failed to get process status for jobId: ${jobId}`,
        error.message
      );

      throw new HttpException(
        `Error consulting process status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

