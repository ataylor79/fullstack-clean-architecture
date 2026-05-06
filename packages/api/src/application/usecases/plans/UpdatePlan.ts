import type { DayOfWeek } from "@domain/entities/WorkoutPlan";
import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import { NotFoundError } from "@presentation/errors";

export interface UpdatePlanInput {
  daysOfWeek?: DayOfWeek[];
  numWeeks?: number;
}

export async function updatePlan(
  planRepo: IWorkoutPlanRepository,
  id: string,
  userId: string,
  input: UpdatePlanInput,
) {
  const updated = await planRepo.update(id, userId, input);
  if (!updated) throw new NotFoundError("Plan not found");
  return updated;
}
