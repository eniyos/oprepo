import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  Index, OneToMany,
} from 'typeorm';
import { Issue } from './issue.entity';
import { Recommendation } from './recommendation.entity';

@Entity('repositories')
export class Repository {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true })
  @Index()
  githubId: number;

  @Column({ unique: true, length: 255 })
  @Index()
  fullName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', array: true, default: [] })
  topics: string[];

  @Column({ type: 'text', nullable: true })
  homepage?: string;

  @Column({ length: 100, nullable: true })
  license?: string;

  @Column({ length: 100, nullable: true })
  primaryLanguage?: string;

  @Column({ type: 'text', array: true, default: [] })
  secondaryLanguages: string[];

  @Column({ type: 'text', array: true, default: [] })
  frameworks: string[];

  @Column({ type: 'text', array: true, default: [] })
  domainTags: string[];

  @Column({ default: 0 })
  stargazersCount: number;

  @Column({ default: 0 })
  forksCount: number;

  @Column({ default: 0 })
  openIssuesCount: number;

  @Column({ type: 'float', default: 0 })
  recentCommitFrequency: number;

  @Column({ type: 'float', nullable: true })
  medianResponseTimeHours?: number;

  @Column({ type: 'float', nullable: true })
  medianMergeTimeHours?: number;

  @Column({ default: 0 })
  activeContributorCount: number;

  @Column({ default: false })
  hasCodeOfConduct: boolean;

  @Column({ default: false })
  hasContributingGuide: boolean;

  @Column({ length: 20, nullable: true })
  difficultyLabel?: string;

  @Column({ type: 'float', default: 0 })
  communityHealthScore: number;

  @Column({ type: 'vector', precision: 384, nullable: true })
  embeddings?: number[];

  @Column({ type: 'timestamptz', nullable: true })
  lastIndexedAt?: Date;

  @OneToMany(() => Issue, (i) => i.repository)
  issues: Issue[];

  @OneToMany(() => Recommendation, (r) => r.repository)
  recommendations: Recommendation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
