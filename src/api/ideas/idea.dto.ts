import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class IdeaDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  authorId: string;
}
