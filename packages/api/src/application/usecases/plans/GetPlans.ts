import type { IWorkoutPlanRepository } from "@domain/repositories/IWorkoutPlanRepository";

export async function getPlans(
  planRepo: IWorkoutPlanRepository,
  userId: string,
) {
  return planRepo.findAll(userId);
}
