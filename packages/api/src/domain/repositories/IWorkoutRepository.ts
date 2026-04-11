import { Workout } from "../entities/Workout";

export interface IWorkoutRepository {
  findAll(): Promise<Workout[]>;
  findById(id: string): Promise<Workout | null>;
  create(data: Omit<Workout, "id" | "createdAt" | "updatedAt">): Promise<Workout>;
  update(id: string, data: Partial<Omit<Workout, "id" | "createdAt" | "updatedAt">>): Promise<Workout | null>;
  delete(id: string): Promise<boolean>;
}
