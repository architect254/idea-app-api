import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Comment } from './comment.entity';
import { User } from '../users/user.entity';

import { UserService } from '../users/user.service';
import { IdeasService } from '../ideas/ideas.service';

import { CommentDto } from './comment.dto';
import { Votes, Idea } from '../ideas/idea.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,
    private userService: UserService,
    private ideaService: IdeasService,
  ) {}

  async create(payload: CommentDto, createdById): Promise<Comment> {
    const { ideaId, value, authorId } = payload;
    const createdBy: User = await this.userService.read(createdById);
    const author: User = await this.userService.read(authorId);
    const idea: Idea = await this.ideaService.read(ideaId);

    const comment = new Comment();

    comment.value = value;
    comment.idea = idea;
    comment.author = author;
    comment.createdBy = createdBy;

    return await this.save(comment);
  }

  async read(id): Promise<Comment> {
    const comment: Comment = await this.commentRepo
      .createQueryBuilder('comment')
      .where('comment.id =:id', { id })
      .leftJoinAndSelect('comment.createdBy', 'createdBy')
      .leftJoinAndSelect('comment.updatedBy', 'updatedBy')
      .leftJoinAndSelect('comment.upvotes', 'upvotes')
      .leftJoinAndSelect('comment.downvotes', 'downvotes')
      .getOne();

    if (!comment) {
      const errorMessage = `comment:${id} not found`;
      throw new NotFoundException(errorMessage);
    }
    return comment;
  }

  async readAll(
    page: number,
    pageSize: number,
    ideaId: string,
  ): Promise<Comment[]> {
    const skip: number = pageSize * (page - 1);
    const comments = await this.commentRepo.createQueryBuilder('comment');
    if (!!ideaId) {
      if (!!(await this.ideaService.read(ideaId))) {
        comments.where('comment.ideaId =:ideaId', { ideaId });
      } else {
        return;
      }
    }
    comments
      .skip(!!skip ? skip : 0)
      .take(!!pageSize ? pageSize : 20)
      .leftJoinAndSelect('comment.createdBy', 'createdBy')
      .leftJoinAndSelect('comment.updatedBy', 'updatedBy')
      .leftJoinAndSelect('comment.upvotes', 'upvotes')
      .leftJoinAndSelect('comment.downvotes', 'downvotes');

    return comments.getMany();
  }

  async update(id, payload: CommentDto, updatedById): Promise<Comment> {
    const { ideaId, value, authorId } = payload;
    const author: User = await this.userService.read(authorId);
    const updatedBy = await this.userService.read(updatedById);
    const idea = await this.ideaService.read(ideaId);

    try {
      await this.commentRepo.update(id, {
        value,
        author,
        updatedBy,
        idea,
      });
      return await this.read(id);
    } catch (error) {
      throw error;
    }
  }

  async drop(id): Promise<any> {
    const comment: Comment = await this.read(id);
    const result = await this.commentRepo.remove(comment);

    if (!result) {
      const errorMessage = `failed to delete comment:${comment.id}`;
      throw new InternalServerErrorException(errorMessage);
    }

    return id;
  }

  async save(comment: Comment): Promise<Comment> {
    try {
      return await this.commentRepo.save(comment);
    } catch (error) {
      if (error.errno === 1062) {
        throw new ConflictException('comment already exists');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async upvote(id: string, voterId: string, userId: string) {
    const comment = await this.read(id);
    const newVoter = await this.userService.read(voterId);
    const updatedBy = await this.userService.read(userId);

    if (await this.vote(comment, newVoter, updatedBy, Votes.UP)) {
      return;
    }
  }

  async downvote(id: string, voterId: string, userId: string) {
    const comment = await this.read(id);
    const newVoter = await this.userService.read(voterId);
    const updatedBy = await this.userService.read(userId);

    if (await this.vote(comment, newVoter, updatedBy, Votes.DOWN)) {
      return;
    }
  }

  private async vote(
    comment: Comment,
    newVoter: User,
    updatedBy: User,
    vote: Votes,
  ) {
    const opposite = vote === Votes.UP ? Votes.DOWN : Votes.UP;

    if (
      comment[opposite].filter(voter => voter.id === newVoter.id).length ||
      comment[vote].filter(voter => voter.id === newVoter.id).length
    ) {
      comment[opposite] = comment[opposite].filter(
        voter => voter.id !== newVoter.id,
      );
      comment[vote] = comment[vote].filter(voter => voter.id !== newVoter.id);
      comment.updatedBy = updatedBy;

      await this.save(comment);
    } else if (!comment[vote].filter(voter => voter.id == newVoter.id).length) {
      comment[vote].push(newVoter);

      await this.save(comment);
    } else {
      throw new BadRequestException('unable to cast vote');
    }

    return comment;
  }
}
