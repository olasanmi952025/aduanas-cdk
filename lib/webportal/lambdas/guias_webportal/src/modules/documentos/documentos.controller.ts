import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  Header,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { SQSProducerService } from "../sqs";
import { Roles } from "../../auth/roles.decorator";
import { DocumentsService } from "./documentos.service";
import { ExportExcelDto } from "./dto/export-excel.dto";
import { ExportPdfDto } from "./dto/export-pdf.dto";
import { GuideFiltersDto } from "./dto/guide-filters.dto";
import { RequestInterface } from "./interfaces/request.interface";
import { ExportStatusService } from "../export-status";

@ApiTags("Guides")
@ApiBearerAuth()
@Controller("guides")
export class DocumentsController {
  private readonly defaultUserId = 142;

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly sqsProducerService: SQSProducerService,
    private readonly exportStatusService: ExportStatusService,
  ) {}

  @Get("")
  @Roles("couriers")
  @ApiOperation({ summary: "Buscar guias con filtros" })
  @ApiResponse({ status: 200, description: "Lista de guias encontrados" })
  async listGuides(@Query() filters: GuideFiltersDto, @Request() request: RequestInterface) {
    const { sub } = request.user;
    const userId = sub.split('_').pop() || this.defaultUserId;
    filters.userId = Number(userId);
    return this.documentsService.listGuides(filters, Number(userId));
  }

  @Post("export/excel")
  @Roles("couriers")
  @ApiOperation({ summary: "Exportar guías a Excel (proceso asíncrono)" })
  @ApiResponse({
    status: 202,
    description:
      "Solicitud de exportación excel recibida. Le notificaremos cuando el archivo esté listo para su descarga.",
  })
  async exportToExcel(
    @Body() exportDto: ExportExcelDto,
    @Request() request: RequestInterface
  ) {
    const { ...filters } = exportDto;

    const { sub } = request.user;
    const userId = sub.split('_').pop() || this.defaultUserId;

    const result = await this.sqsProducerService.sendExcelExportMessage(
      filters,
      Number(userId)
    );

    return {
      success: true,
      message:
        "Solicitud de exportación excel recibida. Le notificaremos cuando el archivo esté listo para su descarga.",
      requestId: result.requestId,
      messageId: result.messageId,
    };
  }

  @Post("export/pdf")
  @Roles("couriers")
  @ApiOperation({ summary: "Exportar guías a PDF (proceso asíncrono)" })
  @ApiResponse({
    status: 202,
    description:
      "Solicitud de exportación PDF recibida. Le notificaremos cuando el archivo esté listo para su descarga.",
  })
  @ApiResponse({
    status: 400,
    description: "Debe proporcionar entre 1 y 20 IDs de guías.",
  })
  async exportToPdf(
    @Body() exportDto: ExportPdfDto,
    @Request() request: RequestInterface
  ) {
    const { sub } = request.user;
    const userId = sub.split('_').pop() || this.defaultUserId;

    const result = await this.sqsProducerService.sendPdfExportMessage(
      exportDto.guideIds,
      Number(userId)
    );

    return {
      success: true,
      message:
        "Solicitud de exportación PDF recibida. Le notificaremos cuando el archivo esté listo para su descarga.",
      requestId: result.requestId,
      messageId: result.messageId,
    };
  }

  @Get("export-status/:requestId")
  @Roles("couriers")
  @ApiOperation({
    summary: "Obtiene el estado de una exportación por requestId",
  })
  @ApiParam({ name: "requestId", description: "ID de la solicitud de exportación" })
  @ApiResponse({ status: 200, description: "Estado de la exportación" })
  @ApiResponse({ status: 404, description: "Estado de exportación no encontrado" })
  async getExportStatus(@Param("requestId") requestId: string) {
    try {
      const status = await this.exportStatusService.getStatus(requestId);

      if (!status) {
        return {
          success: false,
          message: "Export status not found",
        };
      }

      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
