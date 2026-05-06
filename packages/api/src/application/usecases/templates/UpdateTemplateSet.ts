import type { ITemplateExerciseRepository } from "@domain/repositories/ITemplateExerciseRepository";
import type { ITemplateSetRepository } from "@domain/repositories/ITemplateSetRepository";
import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import type { TypedUpdateSetInput } from "@domain/services/setTypeStrategy";
import { ConflictError, NotFoundError } from "@presentation/errors";

export async function updateTemplateSet(
  templateRepo: IWorkoutTemplateRepository,
  templateExerciseRepo: ITemplateExerciseRepository,
  templateSetRepo: ITemplateSetRepository,
  planRepo: IWorkoutPlanRepository,
  templateId: string,
  templateExerciseId: string,
  setId: string,
  userId: string,
  input: TypedUpdateSetInput,
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

  const existing = await templateSetRepo.findById(setId, templateExerciseId);
  if (!existing) throw new NotFoundError("Template set not found");

  if (existing.setType !== input.setType) {
    throw new NotFoundError("Template set not found");
  }

  const { setType: _setType, ...fields } = input;
  const updated = await templateSetRepo.update(
    setId,
    templateExerciseId,
    fields,
  );
  if (!updated) throw new NotFoundError("Template set not found");
  return updated;
}
