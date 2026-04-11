export interface Workout {
  id: string;
  name: string;
  scheduledAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateWorkoutDto = Pick<Workout, "name" | "scheduledAt">;
export type UpdateWorkoutDto = Partial<CreateWorkoutDto & Pick<Workout, "completedAt">>;
