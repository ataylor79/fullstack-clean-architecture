import type { TemplateSection } from "@domain/entities/TemplateExercise";
import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import type { ITemplateExerciseRepository } from "@domain/repositories/ITemplateExerciseRepository";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import { NotFoundError } from "@presentation/errors";

export async function addTemplateExercise(
  templateRepo: IWorkoutTemplateRepository,
  templateExerciseRepo: ITemplateExerciseRepository,
  exerciseRepo: IExerciseRepository,
  templateId: string,
  userId: string,
  input: { exerciseId: string; section: TemplateSection },
) {
  const template = await templateRepo.findById(templateId, userId);
  if (!template) throw new NotFoundError("Template not found");

  const exercise = await exerciseRepo.findById(input.exerciseId);
  if (!exercise) throw new NotFoundError("Exercise not found");

  const orderIndex =
    (await templateExerciseRepo.maxOrderIndexInSection(
      templateId,
      input.section,
    )) + 1;

  return templateExerciseRepo.create({
    templateId,
    exerciseId: input.exerciseId,
    section: input.section,
    orderIndex,
  });
}
