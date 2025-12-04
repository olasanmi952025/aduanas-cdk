"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtil = void 0;
class DateUtil {
    /**
     * Formatea una fecha para Oracle en formato DD/MM/YYYY
     * Usa métodos UTC para evitar problemas de zona horaria
     */
    static formatDateForOracle(date) {
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
    static createUTCDate(dateInput) {
        let date;
        if (dateInput instanceof Date) {
            date = dateInput;
        }
        else {
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
exports.DateUtil = DateUtil;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS51dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGF0ZS51dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLE1BQWEsUUFBUTtJQUNuQjs7O09BR0c7SUFDSCxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBVTtRQUNuQyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN2RCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDOUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ25DLE9BQU8sR0FBRyxHQUFHLElBQUksS0FBSyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGFBQWEsQ0FBQyxTQUF3QjtRQUMzQyxJQUFJLElBQVUsQ0FBQztRQUVmLElBQUksU0FBUyxZQUFZLElBQUksRUFBRSxDQUFDO1lBQzlCLElBQUksR0FBRyxTQUFTLENBQUM7UUFDbkIsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVELDJFQUEyRTtRQUMzRSxzREFBc0Q7UUFDdEQsMEZBQTBGO1FBQzFGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNuQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBRTlCLGdFQUFnRTtRQUNoRSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FDRjtBQXBDRCw0QkFvQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgRGF0ZVV0aWwge1xyXG4gIC8qKlxyXG4gICAqIEZvcm1hdGVhIHVuYSBmZWNoYSBwYXJhIE9yYWNsZSBlbiBmb3JtYXRvIEREL01NL1lZWVlcclxuICAgKiBVc2EgbcOpdG9kb3MgVVRDIHBhcmEgZXZpdGFyIHByb2JsZW1hcyBkZSB6b25hIGhvcmFyaWFcclxuICAgKi9cclxuICBzdGF0aWMgZm9ybWF0RGF0ZUZvck9yYWNsZShkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGRheSA9IFN0cmluZyhkYXRlLmdldFVUQ0RhdGUoKSkucGFkU3RhcnQoMiwgJzAnKTtcclxuICAgIGNvbnN0IG1vbnRoID0gU3RyaW5nKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsICcwJyk7XHJcbiAgICBjb25zdCB5ZWFyID0gZGF0ZS5nZXRVVENGdWxsWWVhcigpO1xyXG4gICAgcmV0dXJuIGAke2RheX0vJHttb250aH0vJHt5ZWFyfWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhIHVuYSBmZWNoYSBlbiBVVEMgcHJlc2VydmFuZG8gZWwgZMOtYS9tZXMvYcOxbyBxdWUgZWwgdXN1YXJpbyBzZWxlY2Npb27Ds1xyXG4gICAqIEVsIGZyb250ZW5kIGVudsOtYSBmZWNoYXMgZW4gZm9ybWF0byBJU08gVVRDIChlajogMjAyNS0wOS0wM1QwMDowMDowMC4wMDBaKVxyXG4gICAqIERlYmVtb3MgdXNhciBtw6l0b2RvcyBVVEMgcGFyYSBleHRyYWVyIGxvcyBjb21wb25lbnRlcyB5IHByZXNlcnZhciBlbCBkw61hIGNvcnJlY3RvXHJcbiAgICovXHJcbiAgc3RhdGljIGNyZWF0ZVVUQ0RhdGUoZGF0ZUlucHV0OiBEYXRlIHwgc3RyaW5nKTogRGF0ZSB7XHJcbiAgICBsZXQgZGF0ZTogRGF0ZTtcclxuICAgIFxyXG4gICAgaWYgKGRhdGVJbnB1dCBpbnN0YW5jZW9mIERhdGUpIHtcclxuICAgICAgZGF0ZSA9IGRhdGVJbnB1dDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRhdGUgPSBuZXcgRGF0ZShkYXRlSW5wdXQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBFbCBmcm9udGVuZCBlbnbDrWEgZmVjaGFzIGVuIFVUQywgYXPDrSBxdWUgdXNhbW9zIG3DqXRvZG9zIFVUQyBwYXJhIGV4dHJhZXJcclxuICAgIC8vIGxvcyBjb21wb25lbnRlcyB5IHByZXNlcnZhciBlbCBkw61hL21lcy9hw7FvIGNvcnJlY3RvXHJcbiAgICAvLyBFamVtcGxvOiAyMDI1LTA5LTAzVDAwOjAwOjAwLjAwMFogLT4gZ2V0VVRDRGF0ZSgpID0gMywgbm8gZ2V0RGF0ZSgpID0gMiAoZW4gaG9yYSBsb2NhbClcclxuICAgIGNvbnN0IHllYXIgPSBkYXRlLmdldFVUQ0Z1bGxZZWFyKCk7XHJcbiAgICBjb25zdCBtb250aCA9IGRhdGUuZ2V0VVRDTW9udGgoKTtcclxuICAgIGNvbnN0IGRheSA9IGRhdGUuZ2V0VVRDRGF0ZSgpO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhciB1bmEgbnVldmEgZmVjaGEgVVRDIGNvbiBsb3MgY29tcG9uZW50ZXMgVVRDIHByZXNlcnZhZG9zXHJcbiAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGgsIGRheSkpO1xyXG4gIH1cclxufVxyXG5cclxuIl19