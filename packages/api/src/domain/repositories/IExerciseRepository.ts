import type { Exercise } from "@domain/entities/Exercise";

export interface IExerciseRepository {
  findAll(): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
  create(
    data: Omit<Exercise, "id" | "createdAt" | "updatedAt">,
  ): Promise<Exercise>;
  update(
    id: string,
    data: Partial<Omit<Exercise, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Exercise | null>;
  delete(id: string): Promise<boolean>;
}
