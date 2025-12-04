import {
  Controller,
  Get,
  Param,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  BuscarLocalidadesDto,
  ObtenerUsuariosCreadoresDto,
  ObtenerLocacionesDto,
  ObtenerEmisoresDto,
  GetTypeLocationsDto,
  GetDocTypesDto,
} from "./dto/dictionaries.dto";
import { Public } from "../../auth/public.decorator";
import { DictionariesService } from "./dictionaries.service";

@ApiTags("dictionaries")
@ApiBearerAuth()
@Controller("dictionaries")
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Public()
  @Get("type-locations")
  @ApiOperation({ summary: "Obtener tipos de locación" })
  @ApiResponse({ status: 200, description: "Lista de tipos de locación" })
  async getTypeLocations(@Query() filters: GetTypeLocationsDto) {
    const documentType = filters?.documentType ?? '';
    return this.dictionariesService.getTypeLocations(documentType);
  }

  @Public()
  @Get("roles")
  @ApiOperation({ summary: "Obtener roles" })
  @ApiResponse({ status: 200, description: "Lista de roles" })
  async getRoles() {
    return this.dictionariesService.getRoles();
  }

  @Public()
  @Get("users-creators")
  @ApiOperation({ summary: "Obtener usuarios creadores" })
  @ApiResponse({ status: 200, description: "Lista de usuarios creadores" })
  async getUsersCreators(@Query() filters: ObtenerUsuariosCreadoresDto) {
    return this.dictionariesService.getUsersCreators(
      filters.soloActivos,
      filters.searchTerm || "",
      filters.page || 1,
      filters.limit || 20
    );
  }

  @Public()
  @Get("locations")
  @ApiOperation({ summary: "Obtener locaciones únicas" })
  @ApiResponse({ status: 200, description: "Lista de locaciones únicas" })
  async getLocations(@Query() filters: ObtenerLocacionesDto) {
    return this.dictionariesService.getLocations(filters);
  }

  @Public()
  @Get("localities-query")
  @ApiOperation({ summary: "Obtener consulta de localidades" })
  @ApiResponse({ status: 200, description: "Consulta estática de localidades" })
  async getLocalitiesDictionary(@Query() filters: BuscarLocalidadesDto) {
    return this.dictionariesService.getLocalitiesDictionary(filters);
  }

  @Public()
  @Get("roles-participation")
  @ApiOperation({ summary: "Obtener roles de participación" })
  @ApiResponse({ status: 200, description: "Lista de roles de participación" })
  async getRolesParticipation() {
    return this.dictionariesService.getRolesParticipation();
  }

  // Endpoints para DocTipoFecha
  @Public()
  @Get('date-types')
  @ApiOperation({ summary: 'Obtener tipos de fecha' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de fecha' })
  async getDateTypes(@Query() filters: GetDocTypesDto) {
    return this.dictionariesService.getDateTypesDoc(filters.typeDoc);
  }

  // Endpoints para DocStatusType
  @Public()
  @Get('status-types')
  @ApiOperation({ summary: 'Obtener tipos de estado' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de estado' })
  async getStatusTypes(@Query() filters: GetDocTypesDto) {
    const typeDoc = filters?.typeDoc || 'MFTOC';
    return this.dictionariesService.getStatusTypesDoc(typeDoc);
  }

  // Endpoints para emisores
  @Public()
  @Get('emitters')
  @ApiOperation({ summary: 'Obtener emisores' })
  @ApiResponse({ status: 200, description: 'Lista de emisores' })
  async getEmitters() {
    return this.dictionariesService.getEmitters();
  }

  @Public()
  @Get('emitters-filtered-by-name')
  @ApiOperation({ summary: 'Obtener emisores filtrados por nombre (opcional)' })
  @ApiResponse({ status: 200, description: 'Lista de emisores filtrados por nombre con paginación' })
  async getEmittersFilteredByName(@Query() filters: ObtenerEmisoresDto) {
    return this.dictionariesService.getEmittersWithFilters(
      filters.searchTerm || '',
      filters.page || 1,
      filters.limit || 50
    );
  }

  @Public()
  @Get('participants-by-role-with-person/:rol')
  @ApiOperation({ summary: 'Obtener participantes por rol usando PER_PERSONA' })
  @ApiResponse({ status: 200, description: 'Lista de participantes por rol con información de PER_PERSONA' })
  async getParticipantsByRoleWithPerson(
    @Param('rol') rol: string,
    @Query() filtros: ObtenerEmisoresDto
  ) {
    return this.dictionariesService.getParticipantsByRoleWithPerson(
      rol,
      filtros.searchTerm || '',
      filtros.page || 1,
      filtros.limit || 50
    );
  }

  // Endpoint to list customs offices from DIN schema
  @Public()
  @Get('customs')
  @ApiOperation({ summary: 'Get list of customs offices from DIN schema' })
  @ApiResponse({ status: 200, description: 'List of customs offices' })
  async getCustoms() {
    return this.dictionariesService.getAduanas();
  }
}

