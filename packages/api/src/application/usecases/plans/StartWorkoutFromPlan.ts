import type { ITemplateExerciseRepository } from "@domain/repositories/ITemplateExerciseRepository";
import type { IWorkoutExerciseRepository } from "@domain/repositories/IWorkoutExerciseRepository";
import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import { NotFoundError } from "@presentation/errors";

export interface StartWorkoutFromPlanInput {
  scheduledAt: Date;
}

export async function startWorkoutFromPlan(
  planRepo: IWorkoutPlanRepository,
  templateRepo: IWorkoutTemplateRepository,
  templateExerciseRepo: ITemplateExerciseRepository,
  workoutRepo: IWorkoutRepository,
  workoutExerciseRepo: IWorkoutExerciseRepository,
  planId: string,
  userId: string,
  input: StartWorkoutFromPlanInput,
) {
  const plan = await planRepo.findById(planId, userId);
  if (!plan) throw new NotFoundError("Plan not found");

  const template = await templateRepo.findById(plan.templateId, userId);
  if (!template) throw new NotFoundError("Template not found");

  const dateStr = input.scheduledAt.toISOString().slice(0, 10);
  const name = `${template.name} — ${dateStr}`;

  const workout = await workoutRepo.create({
    userId,
    planId,
    name,
    difficulty: template.difficulty,
    type: template.type,
    scheduledAt: input.scheduledAt,
    durationMinutes: null,
    completedAt: null,
    rating: null,
    notes: null,
  });

  const templateExercises = await templateExerciseRepo.findByTemplateId(
    plan.templateId,
  );

  const exercises = await workoutExerciseRepo.createMany(
    templateExercises.map((te, i) => ({
      workoutId: workout.id,
      exerciseId: te.exerciseId,
      section: te.section,
      orderIndex: i + 1,
    })),
  );

  return { ...workout, exercises };
}
