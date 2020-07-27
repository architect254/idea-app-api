import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Idea, Votes } from './idea.entity';
import { IdeaDto } from './idea.dto';
import { UserService } from '../users/user.service';
import { User } from '../users/user.entity';

@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(Idea)
    private ideaRepo: Repository<Idea>,
    private userService: UserService,
  ) {}

  async create(payload: IdeaDto, createdById): Promise<Idea> {
    const { title, description, authorId } = payload;
    const createdBy: User = await this.userService.read(createdById);
    const author: User = await this.userService.read(authorId);

    const idea = new Idea();

    idea.title = title;
    idea.description = description;
    idea.author = author;
    idea.createdBy = createdBy;

    return await this.save(idea);
  }

  async read(id): Promise<Idea> {
    const idea: Idea = await this.ideaRepo
      .createQueryBuilder('idea')
      .where('idea.id =:id', { id })
      .leftJoinAndSelect('idea.createdBy', 'createdBy')
      .leftJoinAndSelect('idea.updatedBy', 'updatedBy')
      .leftJoinAndSelect('idea.upvotes', 'upvotes')
      .leftJoinAndSelect('idea.downvotes', 'downvotes')
      .getOne();

    if (!idea) {
      const errorMessage = `idea:${id} not found`;
      throw new NotFoundException(errorMessage);
    }
    return idea;
  }

  async readAll(
    page: number,
    pageSize: number,
    authorId: string,
  ): Promise<Idea[]> {
    const skip: number = pageSize * (page - 1);
    const ideas = await this.ideaRepo.createQueryBuilder('idea');
    if (!!authorId) {
      if (!!(await this.userService.read(authorId))) {
        ideas.where('idea.authorId =:authorId', { authorId });
      } else {
        return;
      }
    }
    ideas
      .skip(!!skip ? skip : 0)
      .take(!!pageSize ? pageSize : 20)
      .leftJoinAndSelect('idea.createdBy', 'createdBy')
      .leftJoinAndSelect('idea.updatedBy', 'updatedBy')
      .leftJoinAndSelect('idea.upvotes', 'upvotes')
      .leftJoinAndSelect('idea.downvotes', 'downvotes');

    return ideas.getMany();
  }

  async update(id, payload: IdeaDto, updatedById): Promise<Idea> {
    const { title, description, authorId } = payload;
    const author: User = await this.userService.read(authorId);
    const updatedBy = await this.userService.read(updatedById);

    try {
      await this.ideaRepo.update(id, { title, description, author, updatedBy });
      return await this.read(id);
    } catch (error) {
      throw error;
    }
  }

  async drop(id): Promise<any> {
    const idea: Idea = await this.read(id);
    const result = await this.ideaRepo.remove(idea);

    if (!result) {
      const errorMessage = `failed to delete idea:${idea.id}`;
      throw new InternalServerErrorException(errorMessage);
    }

    return id;
  }

  async save(idea: Idea): Promise<Idea> {
    try {
      return await this.ideaRepo.save(idea);
    } catch (error) {
      if (error.errno === 1062) {
        throw new ConflictException('idea already exists');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async bookmark(id: string, bookmarkerId: string, userId: string) {
    const idea = await this.read(id);
    const bookmarker = await this.userService.read(bookmarkerId);
    const updatedBy = await this.userService.read(userId);

    if (
      !bookmarker.bookmarks.filter(bookmark => bookmark.id === idea.id).length
    ) {
      bookmarker.bookmarks.push(idea);
      bookmarker.updatedBy = updatedBy;

      await this.userService.save(bookmarker);
      return;
    } else {
      throw new ConflictException('idea already bookmarked');
    }
  }

  async unBookmark(id: string, bookmarkerId: string, userId: string) {
    const idea = await this.read(id);
    const bookmarker = await this.userService.read(bookmarkerId);
    const updatedBy = await this.userService.read(userId);

    if (
      bookmarker.bookmarks.filter(bookmark => bookmark.id === idea.id).length
    ) {
      bookmarker.bookmarks = bookmarker.bookmarks.filter(
        bookmark => bookmark.id != id,
      );
      bookmarker.updatedBy = updatedBy;
      await this.userService.save(bookmarker);
      return;
    } else {
      throw new ConflictException('idea already unbookmarked');
    }
  }

  async upvote(id: string, voterId: string, userId: string) {
    const idea = await this.read(id);
    const newVoter = await this.userService.read(voterId);
    const updatedBy = await this.userService.read(userId);

    if (await this.vote(idea, newVoter, updatedBy, Votes.UP)) {
      return;
    }
  }

  async downvote(id: string, voterId: string, userId: string) {
    const idea = await this.read(id);
    const newVoter = await this.userService.read(voterId);
    const updatedBy = await this.userService.read(userId);

    if (await this.vote(idea, newVoter, updatedBy, Votes.DOWN)) {
      return;
    }
  }

  private async vote(idea: Idea, newVoter: User, updatedBy: User, vote: Votes) {
    const opposite = vote === Votes.UP ? Votes.DOWN : Votes.UP;

    if (
      idea[opposite].filter(voter => voter.id === newVoter.id).length ||
      idea[vote].filter(voter => voter.id === newVoter.id).length
    ) {
      idea[opposite] = idea[opposite].filter(voter => voter.id !== newVoter.id);
      idea[vote] = idea[vote].filter(voter => voter.id !== newVoter.id);
      idea.updatedBy = updatedBy;

      await this.save(idea);
    } else if (!idea[vote].filter(voter => voter.id == newVoter.id).length) {
      idea[vote].push(newVoter);

      await this.save(idea);
    } else {
      throw new BadRequestException('unable to cast vote');
    }

    return idea;
  }
}
