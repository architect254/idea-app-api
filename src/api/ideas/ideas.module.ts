import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { UserService } from '../users/user.service';

import { Idea } from './idea.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Idea, User])],
  controllers: [IdeasController],
  providers: [IdeasService, UserService],
})
export class IdeasModule {}
