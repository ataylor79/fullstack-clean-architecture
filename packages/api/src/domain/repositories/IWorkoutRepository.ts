import type { Workout } from "@domain/entities/Workout";

export interface IWorkoutRepository {
  findAll(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Workout[]; total: number }>;
  findById(id: string, userId: string): Promise<Workout | null>;
  create(
    data: Omit<Workout, "id" | "createdAt" | "updatedAt">,
  ): Promise<Workout>;
  update(
    id: string,
    userId: string,
    data: Partial<Omit<Workout, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<Workout | null>;
  findByPlanId(planId: string, userId: string): Promise<Workout[]>;
  delete(id: string, userId: string): Promise<boolean>;
}
