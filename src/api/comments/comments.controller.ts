import { Controller, UseGuards, Post, Body, Get, Param, Query, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CommentsService } from './comments.service';

import { GetUser } from 'src/auth/get-user.decorator';

import { CommentDto } from './comment.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  async httpPost(@Body() payload: CommentDto, @GetUser('id') userId: string) {
    return await this.commentsService.create(payload, userId);
  }

  @Get('/:id')
  async httpGet(@Param('id') id) {
    return await this.commentsService.read(id);
  }

  @Get()
  async httpGetAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('ideaId') ideaId: string,
  ) {
    return await this.commentsService.readAll(page, pageSize, ideaId);
  }

  @Put('/:id')
  async httpPut(
    @Param('id') id,
    @Body() payload: CommentDto,
    @GetUser('id') userId: string,
  ) {
    return await this.commentsService.update(id, payload, userId);
  }

  @Delete('/:id')
  async httpDelete(@Param('id') id) {
    return await this.commentsService.drop(id);
  }

  @Post('/:id/upvote')
  async httpUpvote(
    @Param('id') id: string,
    @Body('voterId') voterId: string,
    @GetUser('id') userId: string,
  ) {
    return await this.commentsService.upvote(id, voterId, userId);
  }

  @Post('/:id/downvote')
  async httpDownvote(
    @Param('id') id: string,
    @Body('voterId') voterId: string,
    @GetUser('id') userId: string,
  ) {
    return await this.commentsService.downvote(id, voterId, userId);
  }
}
