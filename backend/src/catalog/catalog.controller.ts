import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { CatalogService } from "./catalog.service";
import type { CreateLicenceDto } from "./dto/create-licence.dto";
import type { CreateModuleGroupDto } from "./dto/create-module-group.dto";
import type { CreateModuleDto } from "./dto/create-module.dto";
import type { CreateQuestionDto } from "./dto/create-question.dto";
import type { LinkLicenceModuleGroupDto } from "./dto/link-licence-module-group.dto";
import { AuthGuard } from "../auth/auth.guard";
import { AdminGuard } from "../auth/admin.guard";
import type { AssignQuestionDto } from "./dto/assign-question.dto";
import type { AuthenticatedUser } from "../auth/auth.types";

type AuthRequest = Request & { user?: AuthenticatedUser };

@Controller()
@UseGuards(AuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("licences")
  async listLicences(@Req() request: AuthRequest) {
    return this.catalogService.listLicences(request.user);
  }

  @UseGuards(AdminGuard)
  @Post("licences")
  async createLicence(@Body() body: CreateLicenceDto) {
    return this.catalogService.createLicence(body);
  }

  @Get("module-groups")
  async listModuleGroups() {
    return this.catalogService.listModuleGroups();
  }

  @UseGuards(AdminGuard)
  @Post("module-groups")
  async createModuleGroup(@Body() body: CreateModuleGroupDto) {
    return this.catalogService.createModuleGroup(body);
  }

  @UseGuards(AdminGuard)
  @Post("licences/:id/module-groups")
  async linkLicenceModuleGroup(
    @Param("id", ParseIntPipe) licenceId: number,
    @Body() body: LinkLicenceModuleGroupDto,
  ) {
    return this.catalogService.linkLicenceModuleGroup(licenceId, body);
  }

  @Get("modules")
  async listModules(@Query("moduleGroupId") moduleGroupId?: string) {
    const parsed = moduleGroupId ? Number(moduleGroupId) : undefined;
    return this.catalogService.listModules(parsed);
  }

  @UseGuards(AdminGuard)
  @Post("modules")
  async createModule(@Body() body: CreateModuleDto) {
    return this.catalogService.createModule(body);
  }

  @Get("questions")
  async listQuestions(@Query("moduleId") moduleId?: string) {
    const parsed = moduleId ? Number(moduleId) : undefined;
    return this.catalogService.listQuestions(parsed);
  }

  @UseGuards(AdminGuard)
  @Get("questions/unassigned")
  async listUnassignedQuestions() {
    return this.catalogService.listUnassignedQuestions();
  }

  @UseGuards(AdminGuard)
  @Post("questions")
  async createQuestion(@Body() body: CreateQuestionDto) {
    return this.catalogService.createQuestion(body);
  }

  @UseGuards(AdminGuard)
  @Patch("questions/:id/assign")
  async assignQuestion(
    @Param("id", ParseIntPipe) questionId: number,
    @Body() body: AssignQuestionDto,
  ) {
    return this.catalogService.assignQuestion(questionId, body);
  }

  @UseGuards(AdminGuard)
  @Post("imports/elwis-binnen")
  async importElwisBinnen() {
    return this.catalogService.importElwisBinnen();
  }

  @UseGuards(AdminGuard)
  @Post("imports/elwis-see")
  async importElwisSee() {
    return this.catalogService.importElwisSee();
  }

  @UseGuards(AdminGuard)
  @Post("admin/clear-catalog")
  async clearCatalog() {
    return this.catalogService.clearCatalog();
  }
}
