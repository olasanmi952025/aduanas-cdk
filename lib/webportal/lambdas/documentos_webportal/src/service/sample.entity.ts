import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'samples' })
export class SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}


