import type { ITemplateExerciseRepository } from "@domain/repositories/ITemplateExerciseRepository";
import type { ITemplateSetRepository } from "@domain/repositories/ITemplateSetRepository";
import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import { ConflictError, NotFoundError } from "@presentation/errors";

export async function deleteTemplateSet(
  templateRepo: IWorkoutTemplateRepository,
  templateExerciseRepo: ITemplateExerciseRepository,
  templateSetRepo: ITemplateSetRepository,
  planRepo: IWorkoutPlanRepository,
  templateId: string,
  templateExerciseId: string,
  setId: string,
  userId: string,
) {
  const template = await templateRepo.findById(templateId, userId);
  if (!template) throw new NotFoundError("Template not found");

  const inUse = await planRepo.existsByTemplateId(templateId);
  if (inUse)
    throw new ConflictError(
      "Cannot modify sets on a template that is in use by a plan",
    );

  const templateExercise =
    await templateExerciseRepo.findById(templateExerciseId);
  if (!templateExercise || templateExercise.templateId !== templateId)
    throw new NotFoundError("Template exercise not found");

  const deleted = await templateSetRepo.delete(setId, templateExerciseId);
  if (!deleted) throw new NotFoundError("Template set not found");
}
