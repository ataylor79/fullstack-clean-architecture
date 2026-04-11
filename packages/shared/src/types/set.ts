export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSetDto = Pick<
  WorkoutSet,
  "workoutId" | "exerciseId" | "setNumber" | "reps" | "weightKg" | "notes"
>;
export type UpdateSetDto = Partial<
  Pick<WorkoutSet, "reps" | "weightKg" | "notes">
>;
