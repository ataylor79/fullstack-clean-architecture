import { ExerciseCategory } from "@domain/entities/Exercise";
import { WorkoutType } from "@domain/entities/Workout";
import type { SetType } from "@domain/entities/Set";

export function allowedSetTypesForWorkout(workoutType: WorkoutType): Set<SetType> {
  switch (workoutType) {
    case WorkoutType.STRENGTH:  return new Set(["strength"]);
    case WorkoutType.CARDIO:    return new Set(["cardio"]);
    case WorkoutType.HIIT:      return new Set(["hiit", "strength"]);
    case WorkoutType.YOGA:      return new Set(["yoga"]);
    case WorkoutType.PILATES:   return new Set(["pilates"]);
    case WorkoutType.MOBILITY:  return new Set(["mobility"]);
    case WorkoutType.HYBRID:    return new Set(["strength", "cardio", "hiit", "yoga", "pilates", "mobility"]);
  }
}

export function requiredExerciseCategoryForSetType(setType: SetType): ExerciseCategory {
  switch (setType) {
    case "strength": return ExerciseCategory.STRENGTH;
    case "cardio":   return ExerciseCategory.CARDIO;
    case "hiit":     return ExerciseCategory.STRENGTH;
    case "yoga":
    case "pilates":
    case "mobility": return ExerciseCategory.FLEXIBILITY;
  }
}

// --- Create input types ---

export type StrengthSetInput = {
  setType: "strength";
  exerciseId: string;
  reps: number;
  weightKg: number;
  restSeconds?: number;
};

export type CardioSetInput = {
  setType: "cardio";
  exerciseId: string;
  distanceMeters?: number;
  durationSeconds: number;
  intensityLevel: number;
};

export type HiitSetInput = {
  setType: "hiit";
  exerciseId: string;
  durationSeconds: number;
  restSeconds?: number;
};

export type MindBodySetInput = {
  setType: "yoga" | "pilates" | "mobility";
  exerciseId: string;
  durationSeconds?: number;
  reps?: number;
};

export type TypedSetInput =
  | StrengthSetInput
  | CardioSetInput
  | HiitSetInput
  | MindBodySetInput;

// --- Update input types (setType required as discriminant, all other fields optional) ---

export type UpdateStrengthSetInput = {
  setType: "strength";
  setNumber?: number;
  exerciseId?: string;
  reps?: number;
  weightKg?: number;
  restSeconds?: number | null;
  notes?: string | null;
};

export type UpdateCardioSetInput = {
  setType: "cardio";
  setNumber?: number;
  exerciseId?: string;
  distanceMeters?: number | null;
  durationSeconds?: number;
  intensityLevel?: number;
  notes?: string | null;
};

export type UpdateHiitSetInput = {
  setType: "hiit";
  setNumber?: number;
  exerciseId?: string;
  durationSeconds?: number;
  restSeconds?: number | null;
  notes?: string | null;
};

export type UpdateMindBodySetInput = {
  setType: "yoga" | "pilates" | "mobility";
  setNumber?: number;
  exerciseId?: string;
  durationSeconds?: number | null;
  reps?: number | null;
  notes?: string | null;
};

export type TypedUpdateSetInput =
  | UpdateStrengthSetInput
  | UpdateCardioSetInput
  | UpdateHiitSetInput
  | UpdateMindBodySetInput;
