import { IsString, IsNotEmpty } from 'class-validator';

export class CommentDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  ideaId: string;
}
