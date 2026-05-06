import type { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  difficulty: WorkoutDifficulty;
  type: WorkoutType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
