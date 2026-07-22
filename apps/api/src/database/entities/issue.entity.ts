import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { Repository } from './repository.entity';

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true })
  @Index()
  githubId: number;

  @ManyToOne(() => Repository, (r) => r.issues, { onDelete: 'CASCADE' })
  @JoinColumn()
  repository: Repository;

  @Column()
  repositoryId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'text', array: true, default: [] })
  labels: string[];

  @Column({ length: 20, default: 'open' })
  @Index()
  state: string;

  @Column({ length: 50, nullable: true })
  difficultyHint?: string;

  @Column({ type: 'text', array: true, default: [] })
  requiredSkills: string[];

  @Column({ default: 0 })
  commentCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
