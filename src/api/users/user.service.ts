import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { UserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(payload: UserDto, createdById): Promise<User> {
    const { username, password, email, dob, firstname, surname } = payload;
    const createdBy: User = await this.read(createdById);
    const user = new User();

    user.username = username;
    user.firstname = firstname;
    user.email = email;
    user.dob = dob;
    user.surname = surname;
    user.createdBy = createdBy;

    await user.encrypt();
    await user.hashPassword(password);

    return await this.save(user);
  }

  async readAll(page: number, pageSize: number): Promise<User[]> {
    const skip: number = pageSize * (page - 1);

    return await this.userRepo.find({ skip, take: pageSize });
  }

  async update(id, payload: UserDto, updatedById): Promise<User> {
    const { username, firstname, email, dob, surname, password } = payload;
    const updatedBy = await this.read(updatedById);
    const user: User = await this.read(id);

    user.username = username || user.username;
    user.firstname = firstname || user.firstname;
    user.email = email || user.email;
    user.dob = dob || user.dob;
    user.surname = surname || user.surname;
    user.updatedBy = updatedBy;

    await user.encrypt();
    await user.hashPassword(password);

    return await this.save(user);
  }

  async drop(id): Promise<any> {
    const user: User = await this.read(id);
    const result = await this.userRepo.remove(user);

    if (!result) {
      const errorMessage = `failed to delete user:${user.id}`;
      throw new InternalServerErrorException(errorMessage);
    }

    return id;
  }

  async read(id): Promise<User> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('user.id =:id', { id })
      .leftJoinAndSelect('user.createdBy', 'createdBy')
      .leftJoinAndSelect('user.updatedBy', 'updatedBy')
      .leftJoinAndSelect('user.bookmarks', 'bookmarks')
      .getOne();

    if (!user || !Object.keys(user).length) {
      const errorMessage = `user:${id} not found`;
      throw new NotFoundException(errorMessage);
    }

    return user;
  }

  async save(user: User): Promise<User> {
    try {
      return await this.userRepo.save(user);
    } catch (error) {
      if (error.errno === 1062) {
        throw new ConflictException('user already exists');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }
}
