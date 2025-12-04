import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { ServiceService } from './service.service';
import { SampleEntity } from './sample.entity';

@ApiTags('samples')
@ApiBearerAuth()
@Controller('samples')
export class ServiceController {
  constructor(private readonly service: ServiceService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get a public message' })
  @ApiResponse({ status: 200, description: 'Returns a public message.' })
  publicEndpoint() {
    return { message: 'public ok' };
  }

  @Get()
  @Roles('admin', 'user', 'viewer')
  @ApiOperation({ summary: 'Get all samples (requires viewer role or higher)' })
  @ApiResponse({ status: 200, description: 'Returns all samples.', type: [SampleEntity] })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Create a new sample (requires user role or higher)' })
  @ApiResponse({ status: 201, description: 'The sample has been successfully created.', type: SampleEntity })
  create(@Body() body: { name: string }) {
    return this.service.create(body.name);
  }

  @Get(':id')
  @Roles('admin', 'user', 'viewer')
  @ApiOperation({ summary: 'Get a sample by ID (requires viewer role or higher)' })
  @ApiResponse({ status: 200, description: 'Returns a single sample.', type: SampleEntity })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Update a sample (requires user role or higher)' })
  @ApiResponse({ status: 200, description: 'The sample has been successfully updated.', type: SampleEntity })
  update(@Param('id') id: string, @Body() body: { name: string }) {
    return this.service.update(id, body.name);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a sample (requires admin role)' })
  @ApiResponse({ status: 204, description: 'The sample has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}


