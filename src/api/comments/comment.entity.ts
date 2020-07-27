import {
    Column,
    Entity,
    ManyToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm';

import { Exclude } from 'class-transformer';

import { BaseEntity } from '../../shared/base-entity';
import { Idea } from '../ideas/idea.entity';
import { User } from '../users/user.entity';

@Entity()
export class Comment extends BaseEntity {
  @Column()
  value: string;

  @Exclude()
  @ManyToOne(() => User)
  @JoinColumn()
  author: User;

  @Column()
  authorId: string;

  @Exclude()
  @ManyToOne(() => Idea)
  @JoinColumn()
  idea: Idea;

  @Column()
  ideaId: string;

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  upvotes: User[];

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  downvotes: User[];
}
