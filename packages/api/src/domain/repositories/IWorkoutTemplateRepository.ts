import type { WorkoutTemplate } from "@domain/entities/WorkoutTemplate";

export interface IWorkoutTemplateRepository {
  findAll(userId: string): Promise<WorkoutTemplate[]>;
  findById(id: string, userId: string): Promise<WorkoutTemplate | null>;
  create(
    data: Omit<WorkoutTemplate, "id" | "createdAt" | "updatedAt" | "deletedAt">,
  ): Promise<WorkoutTemplate>;
  update(
    id: string,
    userId: string,
    data: {
      name?: string;
      difficulty?: WorkoutTemplate["difficulty"];
      type?: WorkoutTemplate["type"];
    },
  ): Promise<WorkoutTemplate | null>;
  delete(id: string, userId: string): Promise<boolean>;
}
