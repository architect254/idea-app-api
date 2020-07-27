import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { User } from 'src/api/users/user.entity';
import { SignUpCredentialsDto } from './dtos/sign-up.dto';
import { SignInCredentialsDto } from './dtos/sign-in.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async signUp(credentials: SignUpCredentialsDto): Promise<User> {
    const { username, password, email, dob, firstname, surname } = credentials;

    const user = new User();
    user.username = username;
    user.firstname = firstname;

    user.email = email;
    user.dob = dob;
    user.surname = surname;
    await user.encrypt();
    await user.hashPassword(password);

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

  async validateUserPassword(credentials: SignInCredentialsDto) {
    const { username, password } = credentials;
    const user = await this.userRepo.findOne({ username });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const isValid = await user.validatePassword(password);

    if (!isValid) {
      return null;
    }
    return user;
  }
}
