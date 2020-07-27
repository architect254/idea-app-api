import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { IdeasService } from './ideas.service';
import { IdeaDto } from './idea.dto';
import { GetUser } from 'src/auth/get-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('api/ideas')
export class IdeasController {
  constructor(private ideasService: IdeasService) {}

  @Post()
  async httpPost(@Body() payload: IdeaDto, @GetUser('id') userId: string) {
    return await this.ideasService.create(payload, userId);
  }

  @Get('/:id')
  async httpGet(@Param('id') id) {
    return await this.ideasService.read(id);
  }

  @Get()
  async httpGetAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('authorId') authorId: string,
  ) {
    return await this.ideasService.readAll(page, pageSize,authorId);
  }

  @Put('/:id')
  async httpPut(
    @Param('id') id,
    @Body() payload: IdeaDto,
    @GetUser('id') userId: string,
  ) {
    return await this.ideasService.update(id, payload, userId);
  }

  @Delete('/:id')
  async httpDelete(@Param('id') id) {
    return await this.ideasService.drop(id);
  }

  @Post('/:id/upvote')
  async httpUpvote(
    @Param('id') id: string,
    @Body('voterId') voterId: string,
    @GetUser('id') userId: string,
  ) {
    return await this.ideasService.upvote(id, voterId, userId);
  }

  @Post('/:id/downvote')
  async httpDownvote(
    @Param('id') id: string,
    @Body('voterId') voterId: string,
    @GetUser('id') userId: string,
  ) {
    return await this.ideasService.downvote(id, voterId, userId);
  }

  @Post('/:id/bookmark')
  async httpBookmark(
    @Param('id') id: string,
    @Body('bookmarkerId') bookmarkerId: string,
    @GetUser('id') userId: string,
  ) {
    return await this.ideasService.bookmark(id, bookmarkerId, userId);
  }

  @Delete('/:id/bookmark')
  async httpUnBookmark(
    @Param('id') id: string,
    @Body('bookmarkerId') bookmarkerId: string,
    @GetUser('id') userId: string,
  ) {
    return await this.ideasService.unBookmark(id, bookmarkerId, userId);
  }
}
