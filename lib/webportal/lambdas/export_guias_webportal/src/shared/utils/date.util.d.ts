export declare class DateUtil {
    /**
     * Formatea una fecha para Oracle en formato DD/MM/YYYY
     * Usa métodos UTC para evitar problemas de zona horaria
     */
    static formatDateForOracle(date: Date): string;
    /**
     * Crea una fecha en UTC preservando el día/mes/año que el usuario seleccionó
     * El frontend envía fechas en formato ISO UTC (ej: 2025-09-03T00:00:00.000Z)
     * Debemos usar métodos UTC para extraer los componentes y preservar el día correcto
     */
    static createUTCDate(dateInput: Date | string): Date;
}
