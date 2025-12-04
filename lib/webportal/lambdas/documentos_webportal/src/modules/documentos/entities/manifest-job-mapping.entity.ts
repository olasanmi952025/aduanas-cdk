import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entidad para mapear documentoId -> jobId del polling_process
 * Permite consultar el estado de un proceso por documentoId
 */
@Entity('MANIFEST_JOB_MAPPING')
export class ManifestJobMapping {
  @PrimaryColumn({ name: 'DOCUMENTO_ID' })
  documentoId: number;

  @Column({ name: 'JOB_ID' })
  jobId: string;

  @Column({ name: 'PROCESS_TYPE' })
  processType: string;

  @Column({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'STATUS', nullable: true })
  status?: string;
}

