import type { WorkoutPlan } from "@domain/entities/WorkoutPlan";

export interface IWorkoutPlanRepository {
  findAll(userId: string): Promise<WorkoutPlan[]>;
  findById(id: string, userId: string): Promise<WorkoutPlan | null>;
  create(
    data: Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt" | "deletedAt">,
  ): Promise<WorkoutPlan>;
  update(
    id: string,
    userId: string,
    data: { daysOfWeek?: WorkoutPlan["daysOfWeek"]; numWeeks?: number },
  ): Promise<WorkoutPlan | null>;
  delete(id: string, userId: string): Promise<boolean>;
  existsByTemplateId(templateId: string): Promise<boolean>;
}
