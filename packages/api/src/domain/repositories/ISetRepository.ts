import { WorkoutSet } from "../entities/Set";

export interface ISetRepository {
  findByWorkoutId(workoutId: string): Promise<WorkoutSet[]>;
  findById(id: string): Promise<WorkoutSet | null>;
  create(data: Omit<WorkoutSet, "id" | "createdAt" | "updatedAt">): Promise<WorkoutSet>;
  update(id: string, data: Partial<Omit<WorkoutSet, "id" | "createdAt" | "updatedAt">>): Promise<WorkoutSet | null>;
  delete(id: string): Promise<boolean>;
}
