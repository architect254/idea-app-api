import {
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from 'src/api/users/user.entity';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  dateCreated?: Date;

  @UpdateDateColumn()
  dateUpdated?: Date;

  @Exclude()
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @Exclude()
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  updatedBy: User;

  @Column({ nullable: true })
  updatedById: string;
}
