/**
 * Utilidades para generar y formatear XML
 */
export class XmlUtil {
  /**
   * Escapa caracteres especiales XML
   * @param text Texto a escapar
   * @returns Texto escapado
   */
  static escapeXml(text: string | null | undefined): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Formatea una fecha al formato YYYY-MM-DD HH:MM:SS.S usado en XML
   * @param date Fecha a formatear
   * @returns Fecha formateada como string
   */
  static formatDateToXml(date: Date | string): string {
    const fecha = date instanceof Date ? date : new Date(date);
    
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    const seconds = String(fecha.getSeconds()).padStart(2, '0');
    // Solo el primer dígito de los milisegundos
    const milliseconds = Math.floor(fecha.getMilliseconds() / 100);
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * Crea el encabezado XML estándar
   * @param encoding Codificación (default: ISO-8859-1)
   * @returns Encabezado XML
   */
  static createXmlHeader(encoding: string = 'ISO-8859-1'): string {
    return `<?xml version="1.0" encoding="${encoding}"?>\n`;
  }
}

