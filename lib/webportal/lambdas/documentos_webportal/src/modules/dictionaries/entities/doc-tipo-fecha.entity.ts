import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('DOCTIPOFECHA')
export class DocTipoFecha {
  @PrimaryColumn({ name: 'CODIGO',length: 10 })
  codigo: string;

  @Column({ name: 'DESCRIPCION', length: 30 })
  descripcion: string;

  @Column({ name: 'ACTIVA' })
  activa: string;

  @Column({ name: 'FECHAACTIVA', type: 'date' })
  fechaActiva: Date;

  @Column({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
  fechaDesactiva?: Date;
}