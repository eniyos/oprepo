import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Developer } from './developer.entity';
import { Recommendation } from './recommendation.entity';

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Developer, { onDelete: 'CASCADE' })
  @JoinColumn()
  developer: Developer;

  @Column()
  @Index()
  developerId: string;

  @ManyToOne(() => Recommendation, { onDelete: 'CASCADE' })
  @JoinColumn()
  recommendation: Recommendation;

  @Column()
  @Index()
  recommendationId: string;

  @Column({ nullable: true })
  rating?: number;

  @Column({ default: false })
  clickedThrough: boolean;

  @Column({ default: false })
  openedPr: boolean;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @CreateDateColumn()
  createdAt: Date;
}
