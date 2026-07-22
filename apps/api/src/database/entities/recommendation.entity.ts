import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Developer } from './developer.entity';
import { Repository } from './repository.entity';
import { Issue } from './issue.entity';

@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Developer, (d) => d.recommendations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'developerId' })
  developer: Developer;

  @Column({ name: 'developerId' })
  @Index()
  developerId: string;

  @ManyToOne(() => Repository, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'repositoryId' })
  repository?: Repository;

  @Column({ name: 'repositoryId', nullable: true })
  repositoryId?: string;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue?: Issue;

  @Column({ name: 'issueId', nullable: true })
  issueId?: string;

  @Column({ type: 'float' })
  matchScore: number;

  @Column({ type: 'jsonb', default: [] })
  matchReasons: string[];

  @Column({ type: 'jsonb', default: {} })
  fitSignals: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  suggestedSteps: string[];

  @Column({ length: 10 })
  type: 'repo' | 'issue';

  @Column({ length: 20, nullable: true })
  feedback?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
