import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";
import { NotFoundError } from "@presentation/errors";

export async function deletePlan(
  planRepo: IWorkoutPlanRepository,
  id: string,
  userId: string,
) {
  const deleted = await planRepo.delete(id, userId);
  if (!deleted) throw new NotFoundError("Plan not found");
}
