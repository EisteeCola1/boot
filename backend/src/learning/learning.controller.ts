import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import type { AnswerQuestionDto } from "./dto/answer-question.dto";
import type { MarkQuestionDto } from "./dto/mark-question.dto";
import { LearningService } from "./learning.service";

type AuthRequest = Request & { user?: AuthenticatedUser };

@Controller()
@UseGuards(AuthGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get("learning/module-groups")
  async listModuleGroups(@Req() request: AuthRequest) {
    return this.learningService.listModuleGroups(request.user);
  }

  @Get("learning/modules/:id/questions")
  async listModuleQuestions(
    @Req() request: AuthRequest,
    @Param("id", ParseIntPipe) moduleId: number,
  ) {
    return this.learningService.listModuleQuestions(moduleId, request.user);
  }

  @Post("learning/questions/:id/answer")
  async answerQuestion(
    @Req() request: AuthRequest,
    @Param("id", ParseIntPipe) questionId: number,
    @Body() body: AnswerQuestionDto,
  ) {
    return this.learningService.answerQuestion(questionId, body, request.user);
  }

  @Patch("learning/questions/:id/mark")
  async markQuestion(
    @Req() request: AuthRequest,
    @Param("id", ParseIntPipe) questionId: number,
    @Body() body: MarkQuestionDto,
  ) {
    return this.learningService.markQuestion(questionId, body, request.user);
  }
}
