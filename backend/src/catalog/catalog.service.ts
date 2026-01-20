import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateLicenceDto } from "./dto/create-licence.dto";
import type { CreateModuleGroupDto } from "./dto/create-module-group.dto";
import type { CreateModuleDto } from "./dto/create-module.dto";
import type { CreateQuestionDto } from "./dto/create-question.dto";
import type { LinkLicenceModuleGroupDto } from "./dto/link-licence-module-group.dto";
import {
  fetchElwisBinnenQuestions,
  fetchElwisSeeQuestions,
} from "./elwis.importer";
import type { AssignQuestionDto } from "./dto/assign-question.dto";
import type { AuthenticatedUser } from "../auth/auth.types";
import type { ImportedQuestion } from "./elwis.importer";

type SignatureAnswer = {
  text: string;
  correct: boolean;
};

function normalizeSignatureText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function buildQuestionSignature(
  text: string,
  imageUrl: string | null | undefined,
  answers: SignatureAnswer[],
): string {
  const normalizedAnswers = answers
    .map((answer) => ({
      text: normalizeSignatureText(answer.text),
      correct: Boolean(answer.correct),
    }))
    .sort((left, right) => {
      if (left.correct !== right.correct) {
        return Number(right.correct) - Number(left.correct);
      }
      return left.text.localeCompare(right.text);
    });

  return JSON.stringify({
    text: normalizeSignatureText(text),
    imageUrl: imageUrl ? normalizeSignatureText(imageUrl) : "",
    answers: normalizedAnswers,
  });
}

function buildImportedSignature(question: ImportedQuestion): string {
  return buildQuestionSignature(
    question.text,
    question.imageUrl,
    question.answers,
  );
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listLicences(user?: AuthenticatedUser) {
    const where =
      user && !user.isAdmin ? { users: { some: { userId: user.id } } } : undefined;
    const licences = await this.prisma.licence.findMany({
      where,
      orderBy: { id: "asc" },
      include: {
        moduleGroups: {
          include: {
            moduleGroup: {
              include: {
                modules: {
                  orderBy: { id: "asc" },
                  include: {
                    questions: {
                      orderBy: { id: "asc" },
                      include: {
                        answerLinks: {
                          include: { answerOption: true },
                          orderBy: { answerOptionId: "asc" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return licences.map((licence) => ({
      id: licence.id,
      title: licence.title,
      moduleGroups: licence.moduleGroups.map((link) => ({
        id: link.moduleGroup.id,
        title: link.moduleGroup.title,
        modules: link.moduleGroup.modules,
      })),
    }));
  }

  async createLicence(dto: CreateLicenceDto) {
    return this.prisma.licence.create({
      data: { title: dto.title },
    });
  }

  async listModuleGroups() {
    return this.prisma.moduleGroup.findMany({
      orderBy: { id: "asc" },
      include: { modules: { orderBy: { id: "asc" } } },
    });
  }

  async createModuleGroup(dto: CreateModuleGroupDto) {
    return this.prisma.moduleGroup.create({
      data: { title: dto.title },
    });
  }

  async linkLicenceModuleGroup(
    licenceId: number,
    dto: LinkLicenceModuleGroupDto,
  ) {
    return this.prisma.licenceModuleGroup.create({
      data: {
        licenceId,
        moduleGroupId: dto.moduleGroupId,
      },
    });
  }

  async listModules(moduleGroupId?: number) {
    return this.prisma.module.findMany({
      where: moduleGroupId ? { moduleGroupId } : undefined,
      orderBy: { id: "asc" },
    });
  }

  async createModule(dto: CreateModuleDto) {
    return this.prisma.module.create({
      data: {
        title: dto.title,
        moduleGroupId: dto.moduleGroupId,
      },
    });
  }

  async listQuestions(moduleId?: number) {
    return this.prisma.question.findMany({
      where: moduleId ? { moduleId } : undefined,
      orderBy: { id: "asc" },
      include: {
        answerLinks: {
          include: { answerOption: true },
          orderBy: { answerOptionId: "asc" },
        },
      },
    });
  }

  async createQuestion(dto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: {
        text: dto.text,
        imageUrl: dto.imageUrl,
        moduleId: dto.moduleId ?? null,
        answerLinks: {
          create: dto.answers.map((answer) => ({
            correct: answer.correct ?? false,
            answerOption: { create: { text: answer.text } },
          })),
        },
      },
      include: {
        answerLinks: { include: { answerOption: true } },
      },
    });
  }

  async importElwisBinnen() {
    const questions = await fetchElwisBinnenQuestions();
    return this.importElwisQuestions(questions);
  }

  async importElwisSee() {
    const questions = await fetchElwisSeeQuestions();
    return this.importElwisQuestions(questions);
  }

  private async importElwisQuestions(questions: ImportedQuestion[]) {
    const existingQuestions = await this.prisma.question.findMany({
      include: { answerLinks: { include: { answerOption: true } } },
    });
    const existingSignatures = new Set<string>();
    for (const question of existingQuestions) {
      existingSignatures.add(
        buildQuestionSignature(
          question.text,
          question.imageUrl,
          question.answerLinks.map((link) => ({
            text: link.answerOption.text,
            correct: link.correct,
          })),
        ),
      );
    }

    let createdQuestions = 0;
    let createdAnswers = 0;
    let skippedQuestions = 0;
    const createdSignatures = new Set<string>();
    for (const question of questions) {
      const signature = buildImportedSignature(question);
      if (existingSignatures.has(signature) || createdSignatures.has(signature)) {
        skippedQuestions += 1;
        continue;
      }
      await this.prisma.question.create({
        data: {
          text: question.text,
          imageUrl: question.imageUrl,
          moduleId: null,
          answerLinks: {
            create: question.answers.map((answer) => ({
              correct: answer.correct,
              answerOption: { create: { text: answer.text } },
            })),
          },
        },
      });
      createdQuestions += 1;
      createdAnswers += question.answers.length;
      createdSignatures.add(signature);
    }

    return {
      createdQuestions,
      createdAnswers,
      skippedQuestions,
    };
  }

  async listUnassignedQuestions() {
    return this.prisma.question.findMany({
      where: { moduleId: null },
      orderBy: { id: "asc" },
      include: {
        answerLinks: {
          include: { answerOption: true },
          orderBy: { answerOptionId: "asc" },
        },
      },
    });
  }

  async assignQuestion(questionId: number, dto: AssignQuestionDto) {
    return this.prisma.question.update({
      where: { id: questionId },
      data: { moduleId: dto.moduleId ?? null },
    });
  }

  async clearCatalog() {
    const [
      attemptAnswers,
      userQuestions,
      questionAnswers,
      answerOptions,
      questions,
      modules,
      licenceLinks,
      moduleGroups,
      licences,
    ] = await this.prisma.$transaction([
      this.prisma.attemptAnswer.deleteMany(),
      this.prisma.userQuestion.deleteMany(),
      this.prisma.questionAnswer.deleteMany(),
      this.prisma.answerOption.deleteMany(),
      this.prisma.question.deleteMany(),
      this.prisma.module.deleteMany(),
      this.prisma.licenceModuleGroup.deleteMany(),
      this.prisma.moduleGroup.deleteMany(),
      this.prisma.licence.deleteMany(),
    ]);

    return {
      attemptAnswers: attemptAnswers.count,
      userQuestions: userQuestions.count,
      questionAnswers: questionAnswers.count,
      answerOptions: answerOptions.count,
      questions: questions.count,
      modules: modules.count,
      licenceLinks: licenceLinks.count,
      moduleGroups: moduleGroups.count,
      licences: licences.count,
    };
  }
}
