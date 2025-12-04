import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('DOCPARTICIPACION')
export class DocParticipacion {
  @PrimaryColumn({ name: 'DOCUMENTO', type: 'number' })
  documento: number;

  @PrimaryColumn({ name: 'ROL' })
  rol: string;

  @Column({ name: 'IDPERSONAPARTICIPANTE', type: 'number', nullable: true })
  idPersonaParticipante?: number;

  @Column({ name: 'NOMBREPARTICIPANTE', nullable: true })
  nombreParticipante?: string;

  @Column({ name: 'CODIGOPAIS', nullable: true })
  codigoPais?: string;

  @Column({ name: 'TIPOID', nullable: true })
  tipoId?: string;

  @Column({ name: 'NACID', nullable: true })
  nacId?: string;

  @Column({ name: 'NUMEROID', nullable: true })
  numeroId?: string;

  @Column({ name: 'ACTIVA' })
  activa: string;

  @Column({ name: 'FECHAACTIVA', type: 'date' })
  fechaActiva: Date;

  @Column({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
  fechaDesactiva?: Date;
}

