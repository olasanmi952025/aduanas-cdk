import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Header,
  Res,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import {
  BuscarDocumentosDto,
  CloseManifestDto,
} from "./dto/documentos.dto";
import { Response } from "express";
import { Roles } from "../../auth/roles.decorator";
import { Public } from "../../auth/public.decorator";
import { DocumentsService } from "./documentos.service";
import { RequestInterface } from "../../interfaces/request.interface";

@ApiTags("documents")
@ApiBearerAuth()
@Controller("documents")
export class DocumentsController {
  private readonly defaultUserId = 8981;
  constructor(private readonly documentsService: DocumentsService) {}

  @Get("")
  @Roles('couriers')
  @ApiOperation({ summary: "Buscar documentos con filtros" })
  @ApiResponse({ status: 200, description: "Lista de documentos encontrados" })
  async searchDocuments(@Query() filtros: BuscarDocumentosDto, @Req() req: RequestInterface) {
    const { sub } = req.user;
    const userId = sub.split('_').pop() || this.defaultUserId;
    filtros.userId = Number(userId);
    return this.documentsService.searchDocuments(filtros);
  }
// IMPORTANTE: Este endpoint debe ir ANTES de @Get(":id")
  @Get("close-manifest/status/:requestId")
  @Roles('couriers')
  @ApiOperation({
    summary: "Consultar estado del cierre de manifiesto",
    description:
      "Consulta el estado del proceso de cierre de manifiesto asíncrono usando el requestId retornado al enviar el proceso con POST /documents/close-manifest-sqs. El estado se consulta desde DynamoDB donde el polling process lo actualiza.",
  })
  @ApiResponse({
    status: 200,
    description: "Estado del proceso de cierre de manifiesto",
  })
  @ApiResponse({
    status: 404,
    description: "Proceso no encontrado para el requestId",
  })
  async getManifestCloseStatus(@Param("requestId") requestId: string) {
    return this.documentsService.getManifestCloseStatus(requestId);
  }
  
  @Post("exports/xml")
  @Roles('couriers')
  @ApiOperation({ 
    summary: "Exportar documentos a XML con filtros (asíncrono)",
    description: "Envía el proceso de exportación XML directamente a la cola SQS. El polling process (marcos/minimis_pweb_polling_process) consumirá el mensaje y lo procesará. Retorna un requestId para consultar el estado en DynamoDB."
  })
  @ApiResponse({ 
    status: 202, 
    description: "Proceso de exportación XML enviado a la cola SQS. Retorna requestId para consultar el estado en DynamoDB."
  })
  async exportDocuments(
    @Body() filters: BuscarDocumentosDto,
    @Query('fileName') fileName?: string
  ) {
    return this.documentsService.exportDocumentsSQS(filters, fileName);
  }

  @Get("exports/xml/status/:requestId")
  @Roles('couriers')
  @ApiOperation({
    summary: "Consultar estado de exportación XML",
    description: "Consulta el estado del proceso de exportación XML asíncrono usando el requestId retornado al enviar el proceso con POST /documents/exports/xml. El estado se consulta desde DynamoDB donde el polling process lo actualiza.",
  })
  @ApiResponse({
    status: 200,
    description: "Estado del proceso de exportación XML",
  })
  @ApiResponse({
    status: 404,
    description: "Proceso no encontrado para el requestId",
  })
  async getXmlExportStatus(@Param("requestId") requestId: string) {
    return this.documentsService.getXmlExportStatus(requestId);
  }

  //@Post("close-manifest")
  //@Roles('couriers')
  //@ApiOperation({
  //  summary: "Cerrar manifiesto de forma síncrona (proceso normal)",
  //  description:
  //    "Ejecuta el proceso de cierre de manifiesto de forma síncrona. El proceso completo (18 pasos) se ejecuta inmediatamente y retorna el resultado final.",
  //})
  //@ApiResponse({
  //  status: 200,
  //  description:
  //    "Manifiesto cerrado exitosamente. Retorna el resultado del proceso completo.",
  //})
  //async closeManifest(@Body() payload: CloseManifestDto) {
  //  return this.documentsService.closeManifestSync(payload);
  //}

  @Post("close-manifest")
  @Roles('couriers')
  @ApiOperation({
    summary: "Cerrar manifiesto de forma asíncrona (cola SQS)",
    description:
      "Envía el proceso de cierre de manifiesto directamente a la cola SQS. El polling process (marcos/minimis_pweb_polling_process) consumirá el mensaje y lo procesará. Retorna un requestId para consultar el estado en DynamoDB.",
  })
  @ApiResponse({
    status: 202,
    description:
      "Proceso de cierre enviado a la cola SQS. Retorna requestId para consultar el estado en DynamoDB.",
  })
  async closeManifestSQS(
    @Body() payload: CloseManifestDto,
    @Req() req: RequestInterface
  ) {
    return this.documentsService.closeManifestSQS(payload, req);
  }

}
