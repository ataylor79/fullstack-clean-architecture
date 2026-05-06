import { ExerciseCategory } from "@domain/entities/Exercise";
import type { SetType } from "@domain/entities/Set";
import { WorkoutType } from "@domain/entities/Workout";

const ALLOWED_SET_TYPES: Record<WorkoutType, Set<SetType>> = {
  [WorkoutType.STRENGTH]: new Set(["strength"]),
  [WorkoutType.CARDIO]: new Set(["cardio"]),
  [WorkoutType.HIIT]: new Set(["hiit", "strength"]),
  [WorkoutType.YOGA]: new Set(["yoga"]),
  [WorkoutType.PILATES]: new Set(["pilates"]),
  [WorkoutType.MOBILITY]: new Set(["mobility"]),
  [WorkoutType.HYBRID]: new Set([
    "strength",
    "cardio",
    "hiit",
    "yoga",
    "pilates",
    "mobility",
  ]),
};

export function allowedSetTypesForWorkout(
  workoutType: WorkoutType,
): Set<SetType> {
  return ALLOWED_SET_TYPES[workoutType];
}

const ALLOWED_EXERCISE_CATEGORIES: Record<SetType, Set<ExerciseCategory>> = {
  strength: new Set([ExerciseCategory.STRENGTH]),
  cardio: new Set([ExerciseCategory.CARDIO]),
  hiit: new Set([ExerciseCategory.STRENGTH, ExerciseCategory.CARDIO]),
  yoga: new Set([ExerciseCategory.FLEXIBILITY]),
  pilates: new Set([ExerciseCategory.FLEXIBILITY]),
  mobility: new Set([ExerciseCategory.FLEXIBILITY]),
};

export function allowedExerciseCategoriesForSetType(
  setType: SetType,
): Set<ExerciseCategory> {
  return ALLOWED_EXERCISE_CATEGORIES[setType];
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
