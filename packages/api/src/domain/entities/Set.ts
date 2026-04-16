export type SetType =
  | "strength"
  | "cardio"
  | "hiit"
  | "yoga"
  | "pilates"
  | "mobility";

interface BaseWorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrengthSet extends BaseWorkoutSet {
  setType: "strength";
  reps: number;
  weightKg: number;
  restSeconds: number | null;
}

export interface CardioSet extends BaseWorkoutSet {
  setType: "cardio";
  distanceMeters: number | null;
  durationSeconds: number;
  intensityLevel: number;
}

export interface HiitSet extends BaseWorkoutSet {
  setType: "hiit";
  durationSeconds: number;
  restSeconds: number | null;
}

export interface MindBodySet extends BaseWorkoutSet {
  setType: "yoga" | "pilates" | "mobility";
  durationSeconds: number | null;
  reps: number | null;
}

export type WorkoutSet = StrengthSet | CardioSet | HiitSet | MindBodySet;
