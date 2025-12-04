import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ADUAN', schema: 'DIN' })
export class DinAduan {
  @PrimaryColumn({ name: 'CODADU' })
  codAdu: number;

  @Column({ name: 'GLOADU', nullable: true })
  gloAdu?: string;

  @Column({ name: 'AUTORI', nullable: true })
  autori?: string;

  @Column({ name: 'FECINI', type: 'date', nullable: true })
  fecIni?: Date;

  @Column({ name: 'FECFIN', type: 'date', nullable: true })
  fecFin?: Date;

  @Column({ name: 'SIGLA', nullable: true })
  sigla?: string;

  @Column({ name: 'FILTROWEB', nullable: true })
  filtroWeb?: string;
}

