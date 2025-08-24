import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant', 
}

export interface Message { 
  id: string; 
  role: MessageRole; 
  content: string; 
  timestamp: Date; 
}

@Entity('conversations') 
export class Conversation {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column('jsonb') 
  messages: Message[];

  @Column({ default: false }) 
  isFinished: boolean;

  @CreateDateColumn() 
  startedAt: Date;

  @Column({ nullable: true }) 
  finishedAt: Date;

  @UpdateDateColumn() 
  updatedAt: Date;
}
