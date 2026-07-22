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
  @JoinColumn()
  developer: Developer;

  @Column()
  @Index()
  developerId: string;

  @ManyToOne(() => Repository, { onDelete: 'CASCADE' })
  @JoinColumn()
  repository?: Repository;

  @Column({ nullable: true })
  repositoryId?: string;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn()
  issue?: Issue;

  @Column({ nullable: true })
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
