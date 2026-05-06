import type { TemplateExercise } from "@domain/entities/TemplateExercise";
import type { TemplateSet } from "@domain/entities/TemplateSet";
import type { ITemplateExerciseRepository } from "@domain/repositories/ITemplateExerciseRepository";
import type { ITemplateSetRepository } from "@domain/repositories/ITemplateSetRepository";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import { NotFoundError } from "@presentation/errors";

export async function getTemplateById(
  templateRepo: IWorkoutTemplateRepository,
  exerciseRepo: ITemplateExerciseRepository,
  setRepo: ITemplateSetRepository,
  id: string,
  userId: string,
) {
  const template = await templateRepo.findById(id, userId);
  if (!template) throw new NotFoundError("Template not found");

  const [exercises, allSets] = await Promise.all([
    exerciseRepo.findByTemplateId(id),
    setRepo.findAllByTemplateId(id),
  ]);

  const setsByExercise = new Map<string, TemplateSet[]>();
  for (const set of allSets) {
    const list = setsByExercise.get(set.templateExerciseId) ?? [];
    list.push(set);
    setsByExercise.set(set.templateExerciseId, list);
  }

  const exercisesWithSets = exercises.map((e: TemplateExercise) => ({
    ...e,
    sets: setsByExercise.get(e.id) ?? [],
  }));

  return { ...template, exercises: exercisesWithSets };
}
