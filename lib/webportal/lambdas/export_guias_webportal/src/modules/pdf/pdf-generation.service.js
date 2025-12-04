"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PdfGenerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfGenerationService = void 0;
const common_1 = require("@nestjs/common");
const archiver_1 = __importDefault(require("archiver"));
let PdfGenerationService = PdfGenerationService_1 = class PdfGenerationService {
    constructor(s3Service, configService, soapClientService, documentsQueryService) {
        this.s3Service = s3Service;
        this.configService = configService;
        this.soapClientService = soapClientService;
        this.documentsQueryService = documentsQueryService;
        this.logger = new common_1.Logger(PdfGenerationService_1.name);
    }
    /**
     * Genera PDFs para las guías especificadas
     * Si es un solo ID: sube el PDF directamente
     * Si son múltiples IDs: genera los PDFs, los comprime en ZIP y sube el ZIP
     * Máximo: 20 guías por solicitud
     */
    async generatePdfForGuides(guideIds, requestId, fileName, userId) {
        this.logger.log(`Generando PDFs para requestId: ${requestId}, IDs: ${guideIds.join(', ')}`);
        // Validar que no haya más de 20 guías
        if (!guideIds || guideIds.length === 0) {
            throw new Error('No se proporcionaron IDs de guías');
        }
        if (guideIds.length > 20) {
            throw new Error('No se pueden generar más de 20 PDFs por solicitud. Máximo permitido: 20 guías.');
        }
        try {
            if (guideIds.length === 1) {
                // Un solo ID: generar y subir PDF directamente
                return await this.generateSinglePdf(guideIds[0], requestId, fileName);
            }
            else {
                // Múltiples IDs: generar PDFs y comprimirlos en ZIP
                return await this.generateMultiplePdfsAsZip(guideIds, requestId, fileName);
            }
        }
        catch (error) {
            this.logger.error(`Error generando PDFs: ${error.message}`, error.stack);
            throw error;
        }
    }
    /**
     * Genera un solo PDF y lo sube a S3
     */
    async generateSinglePdf(guideId, requestId, fileName) {
        this.logger.log(`Generando PDF único para guideId: ${guideId}`);
        // Obtener el número externo del documento
        const externalNumbersMap = await this.documentsQueryService.getExternalNumbersByIds([guideId]);
        const numeroExterno = externalNumbersMap.get(guideId);
        if (!numeroExterno) {
            this.logger.warn(`No se encontró número externo para guideId ${guideId}, usando ID como nombre`);
        }
        // Llamar al servicio SOAP para generar el PDF
        const base64Pdf = await this.soapClientService.generarDocumento('gtime', [
            {
                Nombre: 'iddocumento',
                Valor: guideId,
            },
        ]);
        // Convertir base64 a buffer
        const pdfBuffer = Buffer.from(base64Pdf, 'base64');
        // Preparar nombre de archivo y key de S3
        const finalFileName = fileName || `guia_${numeroExterno}.pdf`;
        const s3Key = `exports/pdfs/${finalFileName}`;
        // Subir a S3
        const s3Url = await this.s3Service.uploadFile({
            buffer: pdfBuffer,
            key: s3Key,
            contentType: 'application/pdf',
        });
        this.logger.log(`PDF generado y subido a S3: ${s3Url}`);
        return {
            filePath: finalFileName,
            s3Key,
            s3Url,
        };
    }
    /**
     * Genera múltiples PDFs y los comprime en un archivo ZIP
     */
    async generateMultiplePdfsAsZip(guideIds, requestId, fileName) {
        this.logger.log(`Generando ${guideIds.length} PDFs y comprimiendo en ZIP`);
        // Obtener los números externos de todos los documentos en lote
        const externalNumbersMap = await this.documentsQueryService.getExternalNumbersByIds(guideIds);
        const pdfPromises = guideIds.map(async (guideId) => {
            try {
                const numeroExterno = externalNumbersMap.get(guideId);
                if (!numeroExterno) {
                    this.logger.warn(`No se encontró número externo para guideId ${guideId}, usando ID como nombre`);
                }
                const base64Pdf = await this.soapClientService.generarDocumento('gtime', [
                    {
                        Nombre: 'iddocumento',
                        Valor: guideId,
                    },
                ]);
                const pdfBuffer = Buffer.from(base64Pdf, 'base64');
                const pdfFileName = `guia_${numeroExterno || guideId}.pdf`;
                return {
                    guideId,
                    buffer: pdfBuffer,
                    fileName: pdfFileName,
                    success: true,
                };
            }
            catch (error) {
                this.logger.error(`Error generando PDF para guideId ${guideId}: ${error.message}`);
                const numeroExterno = externalNumbersMap.get(guideId);
                return {
                    guideId,
                    buffer: null,
                    fileName: `guia_${numeroExterno || guideId}.pdf`,
                    success: false,
                    error: error.message,
                };
            }
        });
        const pdfResults = await Promise.all(pdfPromises);
        const successfulPdfs = pdfResults.filter((result) => result.success);
        if (successfulPdfs.length === 0) {
            throw new Error('No se pudo generar ningún PDF exitosamente');
        }
        this.logger.log(`${successfulPdfs.length} de ${guideIds.length} PDFs generados exitosamente`);
        // Crear archivo ZIP
        const zipBuffer = await this.createZipBuffer(successfulPdfs);
        // Preparar nombre de archivo y key de S3
        const finalFileName = fileName || `guias_${requestId}_${Date.now()}.zip`;
        const s3Key = `exports/pdfs/${finalFileName}`;
        // Subir ZIP a S3
        const s3Url = await this.s3Service.uploadFile({
            buffer: zipBuffer,
            key: s3Key,
            contentType: 'application/zip',
        });
        this.logger.log(`ZIP con ${successfulPdfs.length} PDFs generado y subido a S3: ${s3Url}`);
        return {
            filePath: finalFileName,
            s3Key,
            s3Url,
        };
    }
    /**
     * Crea un buffer ZIP con los PDFs proporcionados
     */
    async createZipBuffer(pdfs) {
        return new Promise((resolve, reject) => {
            const archive = (0, archiver_1.default)('zip', {
                zlib: { level: 9 }, // Máxima compresión
            });
            const chunks = [];
            archive.on('data', (chunk) => {
                chunks.push(chunk);
            });
            archive.on('end', () => {
                const zipBuffer = Buffer.concat(chunks);
                resolve(zipBuffer);
            });
            archive.on('error', (err) => {
                this.logger.error(`Error creando ZIP: ${err.message}`);
                reject(err);
            });
            // Agregar cada PDF al archivo ZIP
            pdfs.forEach((pdf) => {
                archive.append(pdf.buffer, { name: pdf.fileName });
            });
            // Finalizar el archivo
            archive.finalize();
        });
    }
};
exports.PdfGenerationService = PdfGenerationService;
exports.PdfGenerationService = PdfGenerationService = PdfGenerationService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfGenerationService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLWdlbmVyYXRpb24uc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBkZi1nZW5lcmF0aW9uLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUFvRDtBQUtwRCx3REFBZ0M7QUFxQnpCLElBQU0sb0JBQW9CLDRCQUExQixNQUFNLG9CQUFvQjtJQUcvQixZQUNtQixTQUFvQixFQUNwQixhQUE0QixFQUM1QixpQkFBb0MsRUFDcEMscUJBQTRDO1FBSDVDLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFDNUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQUNwQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1FBTjlDLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxzQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQU83RCxDQUFDO0lBRUo7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsb0JBQW9CLENBQ3hCLFFBQWtCLEVBQ2xCLFNBQWlCLEVBQ2pCLFFBQWlCLEVBQ2pCLE1BQWU7UUFFZixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsU0FBUyxVQUFVLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTVGLHNDQUFzQztRQUN0QyxJQUFJLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFLENBQUM7WUFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnRkFBZ0YsQ0FBQyxDQUFDO1FBQ3BHLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FB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Y2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQgeyBDb25maWdTZXJ2aWNlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xuaW1wb3J0IHsgUzNTZXJ2aWNlIH0gZnJvbSAnLi4vczMnO1xuaW1wb3J0IHsgU29hcENsaWVudFNlcnZpY2UgfSBmcm9tICcuL3NvYXAtY2xpZW50LnNlcnZpY2UnO1xuaW1wb3J0IHsgRG9jdW1lbnRzUXVlcnlTZXJ2aWNlIH0gZnJvbSAnLi4vZG9jdW1lbnRvcy9kb2N1bWVudHMtcXVlcnkuc2VydmljZSc7XG5pbXBvcnQgYXJjaGl2ZXIgZnJvbSAnYXJjaGl2ZXInO1xuaW1wb3J0IHsgUmVhZGFibGUgfSBmcm9tICdzdHJlYW0nO1xuXG5pbnRlcmZhY2UgUGRmUmVzdWx0U3VjY2VzcyB7XG4gIGd1aWRlSWQ6IG51bWJlcjtcbiAgYnVmZmVyOiBCdWZmZXI7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIHN1Y2Nlc3M6IHRydWU7XG59XG5cbmludGVyZmFjZSBQZGZSZXN1bHRFcnJvciB7XG4gIGd1aWRlSWQ6IG51bWJlcjtcbiAgYnVmZmVyOiBudWxsO1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBzdWNjZXNzOiBmYWxzZTtcbiAgZXJyb3I6IHN0cmluZztcbn1cblxudHlwZSBQZGZSZXN1bHQgPSBQZGZSZXN1bHRTdWNjZXNzIHwgUGRmUmVzdWx0RXJyb3I7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBQZGZHZW5lcmF0aW9uU2VydmljZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyID0gbmV3IExvZ2dlcihQZGZHZW5lcmF0aW9uU2VydmljZS5uYW1lKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHMzU2VydmljZTogUzNTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnU2VydmljZTogQ29uZmlnU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNvYXBDbGllbnRTZXJ2aWNlOiBTb2FwQ2xpZW50U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50c1F1ZXJ5U2VydmljZTogRG9jdW1lbnRzUXVlcnlTZXJ2aWNlLFxuICApIHt9XG5cbiAgLyoqXG4gICAqIEdlbmVyYSBQREZzIHBhcmEgbGFzIGd1w61hcyBlc3BlY2lmaWNhZGFzXG4gICAqIFNpIGVzIHVuIHNvbG8gSUQ6IHN1YmUgZWwgUERGIGRpcmVjdGFtZW50ZVxuICAgKiBTaSBzb24gbcO6bHRpcGxlcyBJRHM6IGdlbmVyYSBsb3MgUERGcywgbG9zIGNvbXByaW1lIGVuIFpJUCB5IHN1YmUgZWwgWklQXG4gICAqIE3DoXhpbW86IDIwIGd1w61hcyBwb3Igc29saWNpdHVkXG4gICAqL1xuICBhc3luYyBnZW5lcmF0ZVBkZkZvckd1aWRlcyhcbiAgICBndWlkZUlkczogbnVtYmVyW10sXG4gICAgcmVxdWVzdElkOiBzdHJpbmcsXG4gICAgZmlsZU5hbWU/OiBzdHJpbmcsXG4gICAgdXNlcklkPzogbnVtYmVyLFxuICApOiBQcm9taXNlPHsgZmlsZVBhdGg6IHN0cmluZzsgczNLZXk6IHN0cmluZzsgczNVcmw6IHN0cmluZyB9PiB7XG4gICAgdGhpcy5sb2dnZXIubG9nKGBHZW5lcmFuZG8gUERGcyBwYXJhIHJlcXVlc3RJZDogJHtyZXF1ZXN0SWR9LCBJRHM6ICR7Z3VpZGVJZHMuam9pbignLCAnKX1gKTtcblxuICAgIC8vIFZhbGlkYXIgcXVlIG5vIGhheWEgbcOhcyBkZSAyMCBndcOtYXNcbiAgICBpZiAoIWd1aWRlSWRzIHx8IGd1aWRlSWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzZSBwcm9wb3JjaW9uYXJvbiBJRHMgZGUgZ3XDrWFzJyk7XG4gICAgfVxuXG4gICAgaWYgKGd1aWRlSWRzLmxlbmd0aCA+IDIwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNlIHB1ZWRlbiBnZW5lcmFyIG3DoXMgZGUgMjAgUERGcyBwb3Igc29saWNpdHVkLiBNw6F4aW1vIHBlcm1pdGlkbzogMjAgZ3XDrWFzLicpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBpZiAoZ3VpZGVJZHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIC8vIFVuIHNvbG8gSUQ6IGdlbmVyYXIgeSBzdWJpciBQREYgZGlyZWN0YW1lbnRlXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdlbmVyYXRlU2luZ2xlUGRmKGd1aWRlSWRzWzBdLCByZXF1ZXN0SWQsIGZpbGVOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE3Dumx0aXBsZXMgSURzOiBnZW5lcmFyIFBERnMgeSBjb21wcmltaXJsb3MgZW4gWklQXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdlbmVyYXRlTXVsdGlwbGVQZGZzQXNaaXAoZ3VpZGVJZHMsIHJlcXVlc3RJZCwgZmlsZU5hbWUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBnZW5lcmFuZG8gUERGczogJHtlcnJvci5tZXNzYWdlfWAsIGVycm9yLnN0YWNrKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmEgdW4gc29sbyBQREYgeSBsbyBzdWJlIGEgUzNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVTaW5nbGVQZGYoXG4gICAgZ3VpZGVJZDogbnVtYmVyLFxuICAgIHJlcXVlc3RJZDogc3RyaW5nLFxuICAgIGZpbGVOYW1lPzogc3RyaW5nLFxuICApOiBQcm9taXNlPHsgZmlsZVBhdGg6IHN0cmluZzsgczNLZXk6IHN0cmluZzsgczNVcmw6IHN0cmluZyB9PiB7XG4gICAgdGhpcy5sb2dnZXIubG9nKGBHZW5lcmFuZG8gUERGIMO6bmljbyBwYXJhIGd1aWRlSWQ6ICR7Z3VpZGVJZH1gKTtcblxuICAgIC8vIE9idGVuZXIgZWwgbsO6bWVybyBleHRlcm5vIGRlbCBkb2N1bWVudG9cbiAgICBjb25zdCBleHRlcm5hbE51bWJlcnNNYXAgPSBhd2FpdCB0aGlzLmRvY3VtZW50c1F1ZXJ5U2VydmljZS5nZXRFeHRlcm5hbE51bWJlcnNCeUlkcyhbZ3VpZGVJZF0pO1xuICAgIGNvbnN0IG51bWVyb0V4dGVybm8gPSBleHRlcm5hbE51bWJlcnNNYXAuZ2V0KGd1aWRlSWQpO1xuXG4gICAgaWYgKCFudW1lcm9FeHRlcm5vKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKGBObyBzZSBlbmNvbnRyw7MgbsO6bWVybyBleHRlcm5vIHBhcmEgZ3VpZGVJZCAke2d1aWRlSWR9LCB1c2FuZG8gSUQgY29tbyBub21icmVgKTtcbiAgICB9XG5cbiAgICAvLyBMbGFtYXIgYWwgc2VydmljaW8gU09BUCBwYXJhIGdlbmVyYXIgZWwgUERGXG4gICAgY29uc3QgYmFzZTY0UGRmID0gYXdhaXQgdGhpcy5zb2FwQ2xpZW50U2VydmljZS5nZW5lcmFyRG9jdW1lbnRvKCdndGltZScsIFtcbiAgICAgIHtcbiAgICAgICAgTm9tYnJlOiAnaWRkb2N1bWVudG8nLFxuICAgICAgICBWYWxvcjogZ3VpZGVJZCxcbiAgICAgIH0sXG4gICAgXSk7XG5cbiAgICAvLyBDb252ZXJ0aXIgYmFzZTY0IGEgYnVmZmVyXG4gICAgY29uc3QgcGRmQnVmZmVyID0gQnVmZmVyLmZyb20oYmFzZTY0UGRmLCAnYmFzZTY0Jyk7XG5cbiAgICAvLyBQcmVwYXJhciBub21icmUgZGUgYXJjaGl2byB5IGtleSBkZSBTM1xuICAgIGNvbnN0IGZpbmFsRmlsZU5hbWUgPSBmaWxlTmFtZSB8fCBgZ3VpYV8ke251bWVyb0V4dGVybm99LnBkZmA7XG4gICAgY29uc3QgczNLZXkgPSBgZXhwb3J0cy9wZGZzLyR7ZmluYWxGaWxlTmFtZX1gO1xuXG4gICAgLy8gU3ViaXIgYSBTM1xuICAgIGNvbnN0IHMzVXJsID0gYXdhaXQgdGhpcy5zM1NlcnZpY2UudXBsb2FkRmlsZSh7XG4gICAgICBidWZmZXI6IHBkZkJ1ZmZlcixcbiAgICAgIGtleTogczNLZXksXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL3BkZicsXG4gICAgfSk7XG5cbiAgICB0aGlzLmxvZ2dlci5sb2coYFBERiBnZW5lcmFkbyB5IHN1YmlkbyBhIFMzOiAke3MzVXJsfWApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbGVQYXRoOiBmaW5hbEZpbGVOYW1lLFxuICAgICAgczNLZXksXG4gICAgICBzM1VybCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYSBtw7psdGlwbGVzIFBERnMgeSBsb3MgY29tcHJpbWUgZW4gdW4gYXJjaGl2byBaSVBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVNdWx0aXBsZVBkZnNBc1ppcChcbiAgICBndWlkZUlkczogbnVtYmVyW10sXG4gICAgcmVxdWVzdElkOiBzdHJpbmcsXG4gICAgZmlsZU5hbWU/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8eyBmaWxlUGF0aDogc3RyaW5nOyBzM0tleTogc3RyaW5nOyBzM1VybDogc3RyaW5nIH0+IHtcbiAgICB0aGlzLmxvZ2dlci5sb2coYEdlbmVyYW5kbyAke2d1aWRlSWRzLmxlbmd0aH0gUERGcyB5IGNvbXByaW1pZW5kbyBlbiBaSVBgKTtcblxuICAgIC8vIE9idGVuZXIgbG9zIG7Dum1lcm9zIGV4dGVybm9zIGRlIHRvZG9zIGxvcyBkb2N1bWVudG9zIGVuIGxvdGVcbiAgICBjb25zdCBleHRlcm5hbE51bWJlcnNNYXAgPSBhd2FpdCB0aGlzLmRvY3VtZW50c1F1ZXJ5U2VydmljZS5nZXRFeHRlcm5hbE51bWJlcnNCeUlkcyhndWlkZUlkcyk7XG5cbiAgICBjb25zdCBwZGZQcm9taXNlcyA9IGd1aWRlSWRzLm1hcChhc3luYyAoZ3VpZGVJZCk6IFByb21pc2U8UGRmUmVzdWx0PiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBudW1lcm9FeHRlcm5vID0gZXh0ZXJuYWxOdW1iZXJzTWFwLmdldChndWlkZUlkKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghbnVtZXJvRXh0ZXJubykge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYE5vIHNlIGVuY29udHLDsyBuw7ptZXJvIGV4dGVybm8gcGFyYSBndWlkZUlkICR7Z3VpZGVJZH0sIHVzYW5kbyBJRCBjb21vIG5vbWJyZWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmFzZTY0UGRmID0gYXdhaXQgdGhpcy5zb2FwQ2xpZW50U2VydmljZS5nZW5lcmFyRG9jdW1lbnRvKCdndGltZScsIFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOb21icmU6ICdpZGRvY3VtZW50bycsXG4gICAgICAgICAgICBWYWxvcjogZ3VpZGVJZCxcbiAgICAgICAgICB9LFxuICAgICAgICBdKTtcblxuICAgICAgICBjb25zdCBwZGZCdWZmZXIgPSBCdWZmZXIuZnJvbShiYXNlNjRQZGYsICdiYXNlNjQnKTtcbiAgICAgICAgY29uc3QgcGRmRmlsZU5hbWUgPSBgZ3VpYV8ke251bWVyb0V4dGVybm8gfHwgZ3VpZGVJZH0ucGRmYDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZ3VpZGVJZCxcbiAgICAgICAgICBidWZmZXI6IHBkZkJ1ZmZlcixcbiAgICAgICAgICBmaWxlTmFtZTogcGRmRmlsZU5hbWUsXG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgfSBhcyBQZGZSZXN1bHRTdWNjZXNzO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihgRXJyb3IgZ2VuZXJhbmRvIFBERiBwYXJhIGd1aWRlSWQgJHtndWlkZUlkfTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICBjb25zdCBudW1lcm9FeHRlcm5vID0gZXh0ZXJuYWxOdW1iZXJzTWFwLmdldChndWlkZUlkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBndWlkZUlkLFxuICAgICAgICAgIGJ1ZmZlcjogbnVsbCxcbiAgICAgICAgICBmaWxlTmFtZTogYGd1aWFfJHtudW1lcm9FeHRlcm5vIHx8IGd1aWRlSWR9LnBkZmAsXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIH0gYXMgUGRmUmVzdWx0RXJyb3I7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBwZGZSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwocGRmUHJvbWlzZXMpO1xuXG4gICAgY29uc3Qgc3VjY2Vzc2Z1bFBkZnMgPSBwZGZSZXN1bHRzLmZpbHRlcihcbiAgICAgIChyZXN1bHQpOiByZXN1bHQgaXMgUGRmUmVzdWx0U3VjY2VzcyA9PiByZXN1bHQuc3VjY2Vzc1xuICAgICk7XG5cbiAgICBpZiAoc3VjY2Vzc2Z1bFBkZnMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNlIHB1ZG8gZ2VuZXJhciBuaW5nw7puIFBERiBleGl0b3NhbWVudGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5sb2coYCR7c3VjY2Vzc2Z1bFBkZnMubGVuZ3RofSBkZSAke2d1aWRlSWRzLmxlbmd0aH0gUERGcyBnZW5lcmFkb3MgZXhpdG9zYW1lbnRlYCk7XG5cbiAgICAvLyBDcmVhciBhcmNoaXZvIFpJUFxuICAgIGNvbnN0IHppcEJ1ZmZlciA9IGF3YWl0IHRoaXMuY3JlYXRlWmlwQnVmZmVyKHN1Y2Nlc3NmdWxQZGZzKTtcblxuICAgIC8vIFByZXBhcmFyIG5vbWJyZSBkZSBhcmNoaXZvIHkga2V5IGRlIFMzXG4gICAgY29uc3QgZmluYWxGaWxlTmFtZSA9IGZpbGVOYW1lIHx8IGBndWlhc18ke3JlcXVlc3RJZH1fJHtEYXRlLm5vdygpfS56aXBgO1xuICAgIGNvbnN0IHMzS2V5ID0gYGV4cG9ydHMvcGRmcy8ke2ZpbmFsRmlsZU5hbWV9YDtcblxuICAgIC8vIFN1YmlyIFpJUCBhIFMzXG4gICAgY29uc3QgczNVcmwgPSBhd2FpdCB0aGlzLnMzU2VydmljZS51cGxvYWRGaWxlKHtcbiAgICAgIGJ1ZmZlcjogemlwQnVmZmVyLFxuICAgICAga2V5OiBzM0tleSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vemlwJyxcbiAgICB9KTtcblxuICAgIHRoaXMubG9nZ2VyLmxvZyhgWklQIGNvbiAke3N1Y2Nlc3NmdWxQZGZzLmxlbmd0aH0gUERGcyBnZW5lcmFkbyB5IHN1YmlkbyBhIFMzOiAke3MzVXJsfWApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbGVQYXRoOiBmaW5hbEZpbGVOYW1lLFxuICAgICAgczNLZXksXG4gICAgICBzM1VybCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWEgdW4gYnVmZmVyIFpJUCBjb24gbG9zIFBERnMgcHJvcG9yY2lvbmFkb3NcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlWmlwQnVmZmVyKFxuICAgIHBkZnM6IEFycmF5PHsgZmlsZU5hbWU6IHN0cmluZzsgYnVmZmVyOiBCdWZmZXIgfT4sXG4gICk6IFByb21pc2U8QnVmZmVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IGFyY2hpdmUgPSBhcmNoaXZlcignemlwJywge1xuICAgICAgICB6bGliOiB7IGxldmVsOiA5IH0sIC8vIE3DoXhpbWEgY29tcHJlc2nDs25cbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG5cbiAgICAgIGFyY2hpdmUub24oJ2RhdGEnLCAoY2h1bms6IEJ1ZmZlcikgPT4ge1xuICAgICAgICBjaHVua3MucHVzaChjaHVuayk7XG4gICAgICB9KTtcblxuICAgICAgYXJjaGl2ZS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICBjb25zdCB6aXBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KGNodW5rcyk7XG4gICAgICAgIHJlc29sdmUoemlwQnVmZmVyKTtcbiAgICAgIH0pO1xuXG4gICAgICBhcmNoaXZlLm9uKCdlcnJvcicsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBjcmVhbmRvIFpJUDogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9KTtcblxuICAgICAgLy8gQWdyZWdhciBjYWRhIFBERiBhbCBhcmNoaXZvIFpJUFxuICAgICAgcGRmcy5mb3JFYWNoKChwZGYpID0+IHtcbiAgICAgICAgYXJjaGl2ZS5hcHBlbmQocGRmLmJ1ZmZlciwgeyBuYW1lOiBwZGYuZmlsZU5hbWUgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gRmluYWxpemFyIGVsIGFyY2hpdm9cbiAgICAgIGFyY2hpdmUuZmluYWxpemUoKTtcbiAgICB9KTtcbiAgfVxufVxuXG4iXX0=