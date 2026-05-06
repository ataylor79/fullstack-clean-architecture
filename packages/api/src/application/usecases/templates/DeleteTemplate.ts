import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import { ConflictError, NotFoundError } from "@presentation/errors";

export async function deleteTemplate(
  templateRepo: IWorkoutTemplateRepository,
  planRepo: IWorkoutPlanRepository,
  id: string,
  userId: string,
) {
  const template = await templateRepo.findById(id, userId);
  if (!template) throw new NotFoundError("Template not found");

  const inUse = await planRepo.existsByTemplateId(id);
  if (inUse)
    throw new ConflictError("Template is in use by one or more workout plans");

  await templateRepo.delete(id, userId);
}
