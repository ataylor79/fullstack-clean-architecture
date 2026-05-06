import type { DayOfWeek } from "@domain/entities/WorkoutPlan";
import type { ITemplateExerciseRepository } from "@domain/repositories/ITemplateExerciseRepository";
import type { ITemplateSetRepository } from "@domain/repositories/ITemplateSetRepository";
import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import { NotFoundError, UnprocessableEntityError } from "@presentation/errors";

export interface CreatePlanInput {
  templateId: string;
  daysOfWeek: DayOfWeek[];
  numWeeks: number;
}

export async function createPlan(
  templateRepo: IWorkoutTemplateRepository,
  templateExerciseRepo: ITemplateExerciseRepository,
  templateSetRepo: ITemplateSetRepository,
  planRepo: IWorkoutPlanRepository,
  userId: string,
  input: CreatePlanInput,
) {
  const template = await templateRepo.findById(input.templateId, userId);
  if (!template) throw new NotFoundError("Template not found");

  const exercises = await templateExerciseRepo.findByTemplateId(
    input.templateId,
  );
  const mainExercises = exercises.filter((e) => e.section === "main");

  const setChecks = await Promise.all(
    mainExercises.map((e) => templateSetRepo.existsByTemplateExerciseId(e.id)),
  );
  const missingSets = mainExercises.some((_, i) => !setChecks[i]);
  if (missingSets) {
    throw new UnprocessableEntityError(
      "All main exercises must have at least one set defined before creating a plan",
    );
  }

  return planRepo.create({
    userId,
    templateId: input.templateId,
    daysOfWeek: input.daysOfWeek,
    numWeeks: input.numWeeks,
  });
}
