import type { Workout } from "@domain/entities/Workout";

export interface IWorkoutRepository {
  findAll(userId: string): Promise<Workout[]>;
  findById(id: string, userId: string): Promise<Workout | null>;
  create(
    data: Omit<Workout, "id" | "createdAt" | "updatedAt">,
  ): Promise<Workout>;
  update(
    id: string,
    userId: string,
    data: Partial<Omit<Workout, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<Workout | null>;
  delete(id: string, userId: string): Promise<boolean>;
}
