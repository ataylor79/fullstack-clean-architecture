import type { ITemplateExerciseRepository } from "@domain/repositories/ITemplateExerciseRepository";
import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import { ConflictError, NotFoundError } from "@presentation/errors";

export async function removeTemplateExercise(
  templateRepo: IWorkoutTemplateRepository,
  templateExerciseRepo: ITemplateExerciseRepository,
  planRepo: IWorkoutPlanRepository,
  templateId: string,
  templateExerciseId: string,
  userId: string,
) {
  const template = await templateRepo.findById(templateId, userId);
  if (!template) throw new NotFoundError("Template not found");

  const exercise = await templateExerciseRepo.findById(templateExerciseId);
  if (!exercise || exercise.templateId !== templateId)
    throw new NotFoundError("Template exercise not found");

  const inUse = await planRepo.existsByTemplateId(templateId);
  if (inUse)
    throw new ConflictError(
      "Cannot remove exercises from a template that is in use by a plan",
    );

  await templateExerciseRepo.delete(templateExerciseId);
}
