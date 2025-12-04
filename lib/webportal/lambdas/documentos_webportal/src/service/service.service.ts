import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ServiceService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    // Ejemplo de consulta Oracle - ajustar según tu esquema
    const result = await this.dataSource.query(
      'SELECT * FROM samples ORDER BY id'
    );
    return result;
  }

  async create(name: string) {
    // Ejemplo de inserción Oracle - ajustar según tu esquema
    const result = await this.dataSource.query(
      'INSERT INTO samples (name) VALUES (:1) RETURNING id INTO :2',
      [name]
    );
    return { id: result[0]?.id, name };
  }

  async findOne(id: string) {
    const result = await this.dataSource.query(
      'SELECT * FROM samples WHERE id = :1',
      [id]
    );
    
    if (!result || result.length === 0) {
      throw new NotFoundException(`Sample with ID ${id} not found`);
    }
    
    return result[0];
  }

  async update(id: string, name: string) {
    const result = await this.dataSource.query(
      'UPDATE samples SET name = :1 WHERE id = :2',
      [name, id]
    );
    
    // En Oracle, necesitamos verificar si se actualizó algo
    const updated = await this.findOne(id);
    if (!updated) {
      throw new NotFoundException(`Sample with ID ${id} not found`);
    }
    
    return updated;
  }

  async remove(id: string) {
    const result = await this.dataSource.query(
      'DELETE FROM samples WHERE id = :1',
      [id]
    );
    
    // Verificar si se eliminó algo
    const exists = await this.findOne(id).catch(() => null);
    if (exists) {
      throw new NotFoundException(`Sample with ID ${id} not found`);
    }
    
    return { message: `Sample with ID ${id} deleted successfully` };
  }
}


