import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('DOCTIPOLOCACION')
export class DocTipoLocacion {
  @PrimaryColumn({ name: 'CODIGO' })
  codigo: string;

  @Column({ name: 'DESCRIPCION' })
  descripcion: string;

  @Column({ name: 'ACTIVA' })
  activa: string;

  @Column({ name: 'FECHAACTIVA', type: 'date' })
  fechaActiva: Date;

  @Column({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
  fechaDesactiva?: Date;
}

