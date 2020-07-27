import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommentsController } from './comments.controller';

import { CommentsService } from './comments.service';
import { UserService } from '../users/user.service';
import { IdeasService } from '../ideas/ideas.service';

import { Comment } from './comment.entity';
import { Idea } from '../ideas/idea.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment,User,Idea])],
  controllers: [CommentsController],
  providers: [CommentsService, UserService, IdeasService],
})
export class CommentsModule {}
