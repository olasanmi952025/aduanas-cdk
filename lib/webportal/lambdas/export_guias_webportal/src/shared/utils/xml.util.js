"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlUtil = void 0;
/**
 * Utilidades para generar y formatear XML
 */
class XmlUtil {
    /**
     * Escapa caracteres especiales XML
     * @param text Texto a escapar
     * @returns Texto escapado
     */
    static escapeXml(text) {
        if (!text)
            return '';
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
    static formatDateToXml(date) {
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
    static createXmlHeader(encoding = 'ISO-8859-1') {
        return `<?xml version="1.0" encoding="${encoding}"?>\n`;
    }
}
exports.XmlUtil = XmlUtil;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1sLnV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4bWwudXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7R0FFRztBQUNILE1BQWEsT0FBTztJQUNsQjs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUErQjtRQUM5QyxJQUFJLENBQUMsSUFBSTtZQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQzthQUNoQixPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQzthQUN0QixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQzthQUNyQixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQzthQUNyQixPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQzthQUN2QixPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFtQjtRQUN4QyxNQUFNLEtBQUssR0FBRyxJQUFJLFlBQVksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTNELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNqQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDNUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDeEQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDNUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDNUQsNENBQTRDO1FBQzVDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBRS9ELE9BQU8sR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLElBQUksT0FBTyxJQUFJLE9BQU8sSUFBSSxZQUFZLEVBQUUsQ0FBQztJQUNsRixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBbUIsWUFBWTtRQUNwRCxPQUFPLGlDQUFpQyxRQUFRLE9BQU8sQ0FBQztJQUMxRCxDQUFDO0NBQ0Y7QUE1Q0QsMEJBNENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFV0aWxpZGFkZXMgcGFyYSBnZW5lcmFyIHkgZm9ybWF0ZWFyIFhNTFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFhtbFV0aWwge1xyXG4gIC8qKlxyXG4gICAqIEVzY2FwYSBjYXJhY3RlcmVzIGVzcGVjaWFsZXMgWE1MXHJcbiAgICogQHBhcmFtIHRleHQgVGV4dG8gYSBlc2NhcGFyXHJcbiAgICogQHJldHVybnMgVGV4dG8gZXNjYXBhZG9cclxuICAgKi9cclxuICBzdGF0aWMgZXNjYXBlWG1sKHRleHQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xyXG4gICAgaWYgKCF0ZXh0KSByZXR1cm4gJyc7XHJcbiAgICByZXR1cm4gU3RyaW5nKHRleHQpXHJcbiAgICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXHJcbiAgICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcclxuICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxyXG4gICAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXHJcbiAgICAgIC5yZXBsYWNlKC8nL2csICcmYXBvczsnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcm1hdGVhIHVuYSBmZWNoYSBhbCBmb3JtYXRvIFlZWVktTU0tREQgSEg6TU06U1MuUyB1c2FkbyBlbiBYTUxcclxuICAgKiBAcGFyYW0gZGF0ZSBGZWNoYSBhIGZvcm1hdGVhclxyXG4gICAqIEByZXR1cm5zIEZlY2hhIGZvcm1hdGVhZGEgY29tbyBzdHJpbmdcclxuICAgKi9cclxuICBzdGF0aWMgZm9ybWF0RGF0ZVRvWG1sKGRhdGU6IERhdGUgfCBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgZmVjaGEgPSBkYXRlIGluc3RhbmNlb2YgRGF0ZSA/IGRhdGUgOiBuZXcgRGF0ZShkYXRlKTtcclxuICAgIFxyXG4gICAgY29uc3QgeWVhciA9IGZlY2hhLmdldEZ1bGxZZWFyKCk7XHJcbiAgICBjb25zdCBtb250aCA9IFN0cmluZyhmZWNoYS5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKTtcclxuICAgIGNvbnN0IGRheSA9IFN0cmluZyhmZWNoYS5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJyk7XHJcbiAgICBjb25zdCBob3VycyA9IFN0cmluZyhmZWNoYS5nZXRIb3VycygpKS5wYWRTdGFydCgyLCAnMCcpO1xyXG4gICAgY29uc3QgbWludXRlcyA9IFN0cmluZyhmZWNoYS5nZXRNaW51dGVzKCkpLnBhZFN0YXJ0KDIsICcwJyk7XHJcbiAgICBjb25zdCBzZWNvbmRzID0gU3RyaW5nKGZlY2hhLmdldFNlY29uZHMoKSkucGFkU3RhcnQoMiwgJzAnKTtcclxuICAgIC8vIFNvbG8gZWwgcHJpbWVyIGTDrWdpdG8gZGUgbG9zIG1pbGlzZWd1bmRvc1xyXG4gICAgY29uc3QgbWlsbGlzZWNvbmRzID0gTWF0aC5mbG9vcihmZWNoYS5nZXRNaWxsaXNlY29uZHMoKSAvIDEwMCk7XHJcbiAgICBcclxuICAgIHJldHVybiBgJHt5ZWFyfS0ke21vbnRofS0ke2RheX0gJHtob3Vyc306JHttaW51dGVzfToke3NlY29uZHN9LiR7bWlsbGlzZWNvbmRzfWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhIGVsIGVuY2FiZXphZG8gWE1MIGVzdMOhbmRhclxyXG4gICAqIEBwYXJhbSBlbmNvZGluZyBDb2RpZmljYWNpw7NuIChkZWZhdWx0OiBJU08tODg1OS0xKVxyXG4gICAqIEByZXR1cm5zIEVuY2FiZXphZG8gWE1MXHJcbiAgICovXHJcbiAgc3RhdGljIGNyZWF0ZVhtbEhlYWRlcihlbmNvZGluZzogc3RyaW5nID0gJ0lTTy04ODU5LTEnKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiJHtlbmNvZGluZ31cIj8+XFxuYDtcclxuICB9XHJcbn1cclxuXHJcbiJdfQ==