"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuideFiltersDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class GuideFiltersDto {
}
exports.GuideFiltersDto = GuideFiltersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], GuideFiltersDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], GuideFiltersDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], GuideFiltersDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "sort", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date)
], GuideFiltersDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date)
], GuideFiltersDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "dateType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "guideNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "manifestNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "locationType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "participantType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "participant", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null)
            return undefined;
        if (value === 'true' || value === true || value === '1' || value === 1)
            return true;
        if (value === 'false' || value === false || value === '0' || value === 0)
            return false;
        return undefined;
    }),
    (0, class_validator_1.IsBoolean)()
], GuideFiltersDto.prototype, "isSimplified", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "marcas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "faltanteSobrante", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "operationType", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VpZGUtZmlsdGVycy5kdG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJndWlkZS1maWx0ZXJzLmR0by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxxREFNeUI7QUFDekIseURBQW9EO0FBRXBELE1BQWEsZUFBZTtDQXVGM0I7QUF2RkQsMENBdUZDO0FBbkZDO0lBSEMsSUFBQSw0QkFBVSxHQUFFO0lBQ1osSUFBQSwwQkFBUSxHQUFFO0lBQ1YsSUFBQSx3QkFBSSxFQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQzsrQ0FDSDtBQUtoQjtJQUhDLElBQUEsNEJBQVUsR0FBRTtJQUNaLElBQUEsMEJBQVEsR0FBRTtJQUNWLElBQUEsd0JBQUksRUFBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7NkNBQ0w7QUFLZDtJQUhDLElBQUEsNEJBQVUsR0FBRTtJQUNaLElBQUEsMEJBQVEsR0FBRTtJQUNWLElBQUEsd0JBQUksRUFBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7OENBQ0o7QUFJZjtJQUZDLElBQUEsNEJBQVUsR0FBRTtJQUNaLElBQUEsMEJBQVEsR0FBRTs2Q0FDRztBQUlkO0lBRkMsSUFBQSw0QkFBVSxHQUFFO0lBQ1osSUFBQSwwQkFBUSxHQUFFOzhDQUNJO0FBS2Y7SUFIQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLHdCQUFNLEdBQUU7SUFDUixJQUFBLHdCQUFJLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDOzZDQUNMO0FBS1o7SUFIQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLHdCQUFNLEdBQUU7SUFDUixJQUFBLHdCQUFJLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDOzJDQUNQO0FBSVY7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7aURBQ087QUFJbEI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7b0RBQ1U7QUFJckI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7dURBQ2E7QUFJeEI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7K0NBQ0s7QUFJaEI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7cURBQ1c7QUFJdEI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7aURBQ087QUFJbEI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7d0RBQ2M7QUFJekI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7b0RBQ1U7QUFVckI7SUFSQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDZCQUFTLEVBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7UUFDdkIsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxJQUFJO1lBQUUsT0FBTyxTQUFTLENBQUM7UUFDNUQsSUFBSSxLQUFLLEtBQUssTUFBTSxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLEdBQUcsSUFBSSxLQUFLLEtBQUssQ0FBQztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBQ3BGLElBQUksS0FBSyxLQUFLLE9BQU8sSUFBSSxLQUFLLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxHQUFHLElBQUksS0FBSyxLQUFLLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUN2RixPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDLENBQUM7SUFDRCxJQUFBLDJCQUFTLEdBQUU7cURBQ1c7QUFJdkI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7K0NBQ0s7QUFJaEI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7eURBQ2U7QUFJMUI7SUFGQyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7c0RBQ1kiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIElzT3B0aW9uYWwsXHJcbiAgSXNTdHJpbmcsXHJcbiAgSXNOdW1iZXIsXHJcbiAgSXNEYXRlLFxyXG4gIElzQm9vbGVhbixcclxufSBmcm9tIFwiY2xhc3MtdmFsaWRhdG9yXCI7XHJcbmltcG9ydCB7IFR5cGUsIFRyYW5zZm9ybSB9IGZyb20gXCJjbGFzcy10cmFuc2Zvcm1lclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEd1aWRlRmlsdGVyc0R0byB7XHJcbiAgQElzT3B0aW9uYWwoKSBcclxuICBASXNOdW1iZXIoKVxyXG4gIEBUeXBlKCgpID0+IE51bWJlcilcclxuICB1c2VySWQ/OiBudW1iZXI7XHJcblxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNOdW1iZXIoKVxyXG4gIEBUeXBlKCgpID0+IE51bWJlcilcclxuICBwYWdlPzogbnVtYmVyO1xyXG5cclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzTnVtYmVyKClcclxuICBAVHlwZSgoKSA9PiBOdW1iZXIpXHJcbiAgbGltaXQ/OiBudW1iZXI7XHJcblxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIHNvcnQ/OiBzdHJpbmc7XHJcblxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIG9yZGVyPzogc3RyaW5nO1xyXG4gIFxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNEYXRlKClcclxuICBAVHlwZSgoKSA9PiBEYXRlKVxyXG4gIGZyb20/OiBEYXRlO1xyXG5cclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzRGF0ZSgpXHJcbiAgQFR5cGUoKCkgPT4gRGF0ZSlcclxuICB0bz86IERhdGU7XHJcblxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIGRhdGVUeXBlPzogc3RyaW5nO1xyXG5cclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBndWlkZU51bWJlcj86IHN0cmluZztcclxuXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgbWFuaWZlc3ROdW1iZXI/OiBzdHJpbmc7XHJcblxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIHN0YXR1cz86IHN0cmluZztcclxuXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgbG9jYXRpb25UeXBlPzogc3RyaW5nO1xyXG5cclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBsb2NhdGlvbj86IHN0cmluZztcclxuXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgcGFydGljaXBhbnRUeXBlPzogc3RyaW5nO1xyXG5cclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBwYXJ0aWNpcGFudD86IHN0cmluZztcclxuXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBUcmFuc2Zvcm0oKHsgdmFsdWUgfSkgPT4ge1xyXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICBpZiAodmFsdWUgPT09ICd0cnVlJyB8fCB2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gJzEnIHx8IHZhbHVlID09PSAxKSByZXR1cm4gdHJ1ZTtcclxuICAgIGlmICh2YWx1ZSA9PT0gJ2ZhbHNlJyB8fCB2YWx1ZSA9PT0gZmFsc2UgfHwgdmFsdWUgPT09ICcwJyB8fCB2YWx1ZSA9PT0gMCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9KVxyXG4gIEBJc0Jvb2xlYW4oKVxyXG4gIGlzU2ltcGxpZmllZD86IGJvb2xlYW47XHJcblxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIG1hcmNhcz86IHN0cmluZztcclxuXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgZmFsdGFudGVTb2JyYW50ZT86IHN0cmluZztcclxuXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgb3BlcmF0aW9uVHlwZT86IHN0cmluZztcclxufVxyXG5cclxuIl19