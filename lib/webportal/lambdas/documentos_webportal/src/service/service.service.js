"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceService = void 0;
const common_1 = require("@nestjs/common");
let ServiceService = class ServiceService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findAll() {
        // Ejemplo de consulta Oracle - ajustar según tu esquema
        const result = await this.dataSource.query('SELECT * FROM samples ORDER BY id');
        return result;
    }
    async create(name) {
        // Ejemplo de inserción Oracle - ajustar según tu esquema
        const result = await this.dataSource.query('INSERT INTO samples (name) VALUES (:1) RETURNING id INTO :2', [name]);
        return { id: result[0]?.id, name };
    }
    async findOne(id) {
        const result = await this.dataSource.query('SELECT * FROM samples WHERE id = :1', [id]);
        if (!result || result.length === 0) {
            throw new common_1.NotFoundException(`Sample with ID ${id} not found`);
        }
        return result[0];
    }
    async update(id, name) {
        const result = await this.dataSource.query('UPDATE samples SET name = :1 WHERE id = :2', [name, id]);
        // En Oracle, necesitamos verificar si se actualizó algo
        const updated = await this.findOne(id);
        if (!updated) {
            throw new common_1.NotFoundException(`Sample with ID ${id} not found`);
        }
        return updated;
    }
    async remove(id) {
        const result = await this.dataSource.query('DELETE FROM samples WHERE id = :1', [id]);
        // Verificar si se eliminó algo
        const exists = await this.findOne(id).catch(() => null);
        if (exists) {
            throw new common_1.NotFoundException(`Sample with ID ${id} not found`);
        }
        return { message: `Sample with ID ${id} deleted successfully` };
    }
};
exports.ServiceService = ServiceService;
exports.ServiceService = ServiceService = __decorate([
    (0, common_1.Injectable)()
], ServiceService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VydmljZS5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDJDQUErRDtBQUl4RCxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFjO0lBQ3pCLFlBQ21CLFVBQXNCO1FBQXRCLGVBQVUsR0FBVixVQUFVLENBQVk7SUFDdEMsQ0FBQztJQUVKLEtBQUssQ0FBQyxPQUFPO1FBQ1gsd0RBQXdEO1FBQ3hELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQ3hDLG1DQUFtQyxDQUNwQyxDQUFDO1FBQ0YsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBWTtRQUN2Qix5REFBeUQ7UUFDekQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FDeEMsNkRBQTZELEVBQzdELENBQUMsSUFBSSxDQUFDLENBQ1AsQ0FBQztRQUNGLE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFVO1FBQ3RCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQ3hDLHFDQUFxQyxFQUNyQyxDQUFDLEVBQUUsQ0FBQyxDQUNMLENBQUM7UUFFRixJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDbkMsTUFBTSxJQUFJLDBCQUFpQixDQUFDLGtCQUFrQixFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFVLEVBQUUsSUFBWTtRQUNuQyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUN4Qyw0Q0FBNEMsRUFDNUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQ1gsQ0FBQztRQUVGLHdEQUF3RDtRQUN4RCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsTUFBTSxJQUFJLDBCQUFpQixDQUFDLGtCQUFrQixFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFVO1FBQ3JCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQ3hDLG1DQUFtQyxFQUNuQyxDQUFDLEVBQUUsQ0FBQyxDQUNMLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4RCxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1gsTUFBTSxJQUFJLDBCQUFpQixDQUFDLGtCQUFrQixFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxPQUFPLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLHVCQUF1QixFQUFFLENBQUM7SUFDbEUsQ0FBQztDQUNGLENBQUE7QUFoRVksd0NBQWM7eUJBQWQsY0FBYztJQUQxQixJQUFBLG1CQUFVLEdBQUU7R0FDQSxjQUFjLENBZ0UxQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE5vdEZvdW5kRXhjZXB0aW9uIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBEYXRhU291cmNlIH0gZnJvbSAndHlwZW9ybSc7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBTZXJ2aWNlU2VydmljZSB7XHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRhdGFTb3VyY2U6IERhdGFTb3VyY2UsXHJcbiAgKSB7fVxyXG5cclxuICBhc3luYyBmaW5kQWxsKCkge1xyXG4gICAgLy8gRWplbXBsbyBkZSBjb25zdWx0YSBPcmFjbGUgLSBhanVzdGFyIHNlZ8O6biB0dSBlc3F1ZW1hXHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRhdGFTb3VyY2UucXVlcnkoXHJcbiAgICAgICdTRUxFQ1QgKiBGUk9NIHNhbXBsZXMgT1JERVIgQlkgaWQnXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIGFzeW5jIGNyZWF0ZShuYW1lOiBzdHJpbmcpIHtcclxuICAgIC8vIEVqZW1wbG8gZGUgaW5zZXJjacOzbiBPcmFjbGUgLSBhanVzdGFyIHNlZ8O6biB0dSBlc3F1ZW1hXHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRhdGFTb3VyY2UucXVlcnkoXHJcbiAgICAgICdJTlNFUlQgSU5UTyBzYW1wbGVzIChuYW1lKSBWQUxVRVMgKDoxKSBSRVRVUk5JTkcgaWQgSU5UTyA6MicsXHJcbiAgICAgIFtuYW1lXVxyXG4gICAgKTtcclxuICAgIHJldHVybiB7IGlkOiByZXN1bHRbMF0/LmlkLCBuYW1lIH07XHJcbiAgfVxyXG5cclxuICBhc3luYyBmaW5kT25lKGlkOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZGF0YVNvdXJjZS5xdWVyeShcclxuICAgICAgJ1NFTEVDVCAqIEZST00gc2FtcGxlcyBXSEVSRSBpZCA9IDoxJyxcclxuICAgICAgW2lkXVxyXG4gICAgKTtcclxuICAgIFxyXG4gICAgaWYgKCFyZXN1bHQgfHwgcmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICB0aHJvdyBuZXcgTm90Rm91bmRFeGNlcHRpb24oYFNhbXBsZSB3aXRoIElEICR7aWR9IG5vdCBmb3VuZGApO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gcmVzdWx0WzBdO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgdXBkYXRlKGlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZykge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYXRhU291cmNlLnF1ZXJ5KFxyXG4gICAgICAnVVBEQVRFIHNhbXBsZXMgU0VUIG5hbWUgPSA6MSBXSEVSRSBpZCA9IDoyJyxcclxuICAgICAgW25hbWUsIGlkXVxyXG4gICAgKTtcclxuICAgIFxyXG4gICAgLy8gRW4gT3JhY2xlLCBuZWNlc2l0YW1vcyB2ZXJpZmljYXIgc2kgc2UgYWN0dWFsaXrDsyBhbGdvXHJcbiAgICBjb25zdCB1cGRhdGVkID0gYXdhaXQgdGhpcy5maW5kT25lKGlkKTtcclxuICAgIGlmICghdXBkYXRlZCkge1xyXG4gICAgICB0aHJvdyBuZXcgTm90Rm91bmRFeGNlcHRpb24oYFNhbXBsZSB3aXRoIElEICR7aWR9IG5vdCBmb3VuZGApO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gdXBkYXRlZDtcclxuICB9XHJcblxyXG4gIGFzeW5jIHJlbW92ZShpZDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRhdGFTb3VyY2UucXVlcnkoXHJcbiAgICAgICdERUxFVEUgRlJPTSBzYW1wbGVzIFdIRVJFIGlkID0gOjEnLFxyXG4gICAgICBbaWRdXHJcbiAgICApO1xyXG4gICAgXHJcbiAgICAvLyBWZXJpZmljYXIgc2kgc2UgZWxpbWluw7MgYWxnb1xyXG4gICAgY29uc3QgZXhpc3RzID0gYXdhaXQgdGhpcy5maW5kT25lKGlkKS5jYXRjaCgoKSA9PiBudWxsKTtcclxuICAgIGlmIChleGlzdHMpIHtcclxuICAgICAgdGhyb3cgbmV3IE5vdEZvdW5kRXhjZXB0aW9uKGBTYW1wbGUgd2l0aCBJRCAke2lkfSBub3QgZm91bmRgKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHsgbWVzc2FnZTogYFNhbXBsZSB3aXRoIElEICR7aWR9IGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5YCB9O1xyXG4gIH1cclxufVxyXG5cclxuXHJcbiJdfQ==