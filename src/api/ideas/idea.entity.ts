import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { BaseEntity } from '../../shared/base-entity';
import { User } from '../users/user.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Idea extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Exclude()
  @ManyToOne(() => User)
  @JoinColumn()
  author: User;

  @Column()
  authorId: string;

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  upvotes: User[];

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  downvotes: User[];
}

export enum Votes {
  UP = 'upvotes',
  DOWN = 'downvotes',
}
