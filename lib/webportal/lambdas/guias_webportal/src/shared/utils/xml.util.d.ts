/**
 * Utilidades para generar y formatear XML
 */
export declare class XmlUtil {
    /**
     * Escapa caracteres especiales XML
     * @param text Texto a escapar
     * @returns Texto escapado
     */
    static escapeXml(text: string | null | undefined): string;
    /**
     * Formatea una fecha al formato YYYY-MM-DD HH:MM:SS.S usado en XML
     * @param date Fecha a formatear
     * @returns Fecha formateada como string
     */
    static formatDateToXml(date: Date | string): string;
    /**
     * Crea el encabezado XML estándar
     * @param encoding Codificación (default: ISO-8859-1)
     * @returns Encabezado XML
     */
    static createXmlHeader(encoding?: string): string;
}
