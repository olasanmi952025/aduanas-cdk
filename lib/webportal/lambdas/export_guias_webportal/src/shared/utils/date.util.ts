export class DateUtil {
  /**
   * Formatea una fecha para Oracle en formato DD/MM/YYYY
   * Usa métodos UTC para evitar problemas de zona horaria
   */
  static formatDateForOracle(date: Date): string {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Crea una fecha en UTC preservando el día/mes/año que el usuario seleccionó
   * El frontend envía fechas en formato ISO UTC (ej: 2025-09-03T00:00:00.000Z)
   * Debemos usar métodos UTC para extraer los componentes y preservar el día correcto
   */
  static createUTCDate(dateInput: Date | string): Date {
    let date: Date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
    
    // El frontend envía fechas en UTC, así que usamos métodos UTC para extraer
    // los componentes y preservar el día/mes/año correcto
    // Ejemplo: 2025-09-03T00:00:00.000Z -> getUTCDate() = 3, no getDate() = 2 (en hora local)
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    
    // Crear una nueva fecha UTC con los componentes UTC preservados
    return new Date(Date.UTC(year, month, day));
  }
}

