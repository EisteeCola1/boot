import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import type { AnswerQuestionDto } from "./dto/answer-question.dto";
import type { MarkQuestionDto } from "./dto/mark-question.dto";

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async listModuleGroups(user?: AuthenticatedUser) {
    const where = user && !user.isAdmin
      ? {
          licences: {
            some: {
              licence: { users: { some: { userId: user.id } } },
            },
          },
        }
      : undefined;

    const moduleGroups = await this.prisma.moduleGroup.findMany({
      where,
      orderBy: { id: "asc" },
      include: {
        modules: {
          orderBy: { id: "asc" },
          include: { _count: { select: { questions: true } } },
        },
      },
    });

    const moduleIds = moduleGroups.flatMap((group) =>
      group.modules.map((module) => module.id),
    );
    const answeredByModule = new Map<number, number>();
    if (user && moduleIds.length > 0) {
      const answeredQuestions = await this.prisma.question.findMany({
        where: {
          moduleId: { in: moduleIds },
          userQuestions: {
            some: {
              userId: user.id,
              attempts: { some: { answeredRight: true } },
            },
          },
        },
        select: { moduleId: true },
      });
      for (const question of answeredQuestions) {
        if (!question.moduleId) continue;
        answeredByModule.set(
          question.moduleId,
          (answeredByModule.get(question.moduleId) ?? 0) + 1,
        );
      }
    }

    return moduleGroups.map((group) => ({
      id: group.id,
      title: group.title,
      modules: group.modules.map((module) => ({
        id: module.id,
        title: module.title,
        questionCount: module._count.questions,
        answeredCount: answeredByModule.get(module.id) ?? 0,
      })),
    }));
  }

  async listModuleQuestions(moduleId: number, user?: AuthenticatedUser) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        moduleGroup: {
          include: {
            licences: {
              include: { licence: { include: { users: true } } },
            },
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundException("Module not found");
    }

    if (user && !user.isAdmin) {
      const hasAccess = module.moduleGroup.licences.some((link) =>
        link.licence.users.some((entry) => entry.userId === user.id),
      );
      if (!hasAccess) {
        throw new ForbiddenException("Module not allowed");
      }
    }

    const questions = await this.prisma.question.findMany({
      where: { moduleId },
      orderBy: { id: "asc" },
      include: {
        answerLinks: {
          include: { answerOption: true },
          orderBy: { answerOptionId: "asc" },
        },
        userQuestions: {
          where: { userId: user?.id ?? -1 },
          include: {
            attempts: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    return {
      module: { id: module.id, title: module.title },
      questions: questions.map((question) => {
        const userQuestion = question.userQuestions[0];
        const latestAttempt = userQuestion?.attempts?.[0];
        const correctAnswerOptionIds = question.answerLinks
          .filter((link) => link.correct)
          .map((link) => link.answerOptionId);
        const answered = Boolean(latestAttempt);
        const answeredRight = latestAttempt ? latestAttempt.answeredRight : null;
        return {
          id: question.id,
          text: question.text,
          imageUrl: question.imageUrl,
          answers: question.answerLinks.map((link) => ({
            id: link.answerOptionId,
            text: link.answerOption.text,
          })),
          status: {
            marked: userQuestion?.marked ?? false,
            answered,
            answeredRight,
            selectedAnswerOptionId: latestAttempt?.answerOptionId ?? null,
            correctAnswerOptionIds:
              answered && answeredRight === false
                ? correctAnswerOptionIds
                : undefined,
          },
        };
      }),
    };
  }

  async answerQuestion(
    questionId: number,
    dto: AnswerQuestionDto,
    user?: AuthenticatedUser,
  ) {
    if (!user) {
      throw new ForbiddenException("Missing user");
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        module: {
          include: {
            moduleGroup: {
              include: {
                licences: {
                  include: { licence: { include: { users: true } } },
                },
              },
            },
          },
        },
        answerLinks: true,
      },
    });

    if (!question || !question.module) {
      throw new NotFoundException("Question not found");
    }

    if (!user.isAdmin) {
      const hasAccess = question.module.moduleGroup.licences.some((link) =>
        link.licence.users.some((entry) => entry.userId === user.id),
      );
      if (!hasAccess) {
        throw new ForbiddenException("Question not allowed");
      }
    }

    const questionAnswer = await this.prisma.questionAnswer.findUnique({
      where: {
        questionId_answerOptionId: {
          questionId,
          answerOptionId: dto.answerOptionId,
        },
      },
    });

    if (!questionAnswer) {
      throw new BadRequestException("Invalid answer option");
    }

    const userQuestion = await this.prisma.userQuestion.upsert({
      where: { userId_questionId: { userId: user.id, questionId } },
      update: {},
      create: { userId: user.id, questionId },
    });

    const attempt = await this.prisma.attemptAnswer.create({
      data: {
        userQuestionId: userQuestion.id,
        questionId,
        answerOptionId: dto.answerOptionId,
        answeredRight: questionAnswer.correct,
      },
    });

    const correctAnswerOptionIds = question.answerLinks
      .filter((link) => link.correct)
      .map((link) => link.answerOptionId);

    return {
      questionId,
      attemptId: attempt.id,
      answeredRight: attempt.answeredRight,
      selectedAnswerOptionId: attempt.answerOptionId,
      correctAnswerOptionIds:
        attempt.answeredRight ? undefined : correctAnswerOptionIds,
    };
  }

  async markQuestion(
    questionId: number,
    dto: MarkQuestionDto,
    user?: AuthenticatedUser,
  ) {
    if (!user) {
      throw new ForbiddenException("Missing user");
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        module: {
          include: {
            moduleGroup: {
              include: {
                licences: {
                  include: { licence: { include: { users: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!question || !question.module) {
      throw new NotFoundException("Question not found");
    }

    if (!user.isAdmin) {
      const hasAccess = question.module.moduleGroup.licences.some((link) =>
        link.licence.users.some((entry) => entry.userId === user.id),
      );
      if (!hasAccess) {
        throw new ForbiddenException("Question not allowed");
      }
    }

    const userQuestion = await this.prisma.userQuestion.upsert({
      where: { userId_questionId: { userId: user.id, questionId } },
      update: { marked: dto.marked },
      create: { userId: user.id, questionId, marked: dto.marked },
    });

    return { questionId, marked: userQuestion.marked };
  }
}
