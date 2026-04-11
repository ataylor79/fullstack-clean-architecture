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
