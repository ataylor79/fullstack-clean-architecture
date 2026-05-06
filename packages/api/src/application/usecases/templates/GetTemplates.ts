import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";

export async function getTemplates(
  templateRepo: IWorkoutTemplateRepository,
  userId: string,
) {
  return templateRepo.findAll(userId);
}
