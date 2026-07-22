import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  Index, OneToMany,
} from 'typeorm';
import { Recommendation } from './recommendation.entity';

@Entity('developers')
export class Developer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  @Index()
  githubUsername: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ length: 255, nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'jsonb', default: {} })
  skills: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  interests: string[];

  @Column({ type: 'jsonb', default: [] })
  goals: string[];

  @Column({ type: 'jsonb', default: [] })
  constraints: string[];

  @Column({ type: 'vector', precision: 384, nullable: true })
  embeddings?: number[];

  @OneToMany(() => Recommendation, (r) => r.developer)
  recommendations: Recommendation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
