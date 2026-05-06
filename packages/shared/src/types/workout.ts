export interface Workout {
  id: string;
  name: string;
  durationMinutes: number;
  difficulty: string;
  type: string;
  scheduledAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateWorkoutDto = Pick<
  Workout,
  "name" | "scheduledAt" | "durationMinutes" | "difficulty" | "type"
>;
export type UpdateWorkoutDto = Partial<
  CreateWorkoutDto &
    Pick<Workout, "completedAt" | "durationMinutes" | "difficulty" | "type">
>;
