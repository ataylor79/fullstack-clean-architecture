export type HistorySetType =
  | "strength"
  | "cardio"
  | "hiit"
  | "yoga"
  | "pilates"
  | "mobility";

interface BaseHistorySet {
  id: string;
  setNumber: number;
  notes: string | null;
}

export interface StrengthHistorySet extends BaseHistorySet {
  setType: "strength";
  reps: number;
  weightKg: number;
  restSeconds: number | null;
}

export interface CardioHistorySet extends BaseHistorySet {
  setType: "cardio";
  distanceMeters: number | null;
  durationSeconds: number;
  intensityLevel: number;
}

export interface HiitHistorySet extends BaseHistorySet {
  setType: "hiit";
  durationSeconds: number;
  restSeconds: number | null;
}

export interface MindBodyHistorySet extends BaseHistorySet {
  setType: "yoga" | "pilates" | "mobility";
  durationSeconds: number | null;
  reps: number | null;
}

export type HistorySet =
  | StrengthHistorySet
  | CardioHistorySet
  | HiitHistorySet
  | MindBodyHistorySet;

export interface ExerciseHistoryEntry {
  workoutId: string;
  workoutName: string;
  completedAt: string;
  sets: HistorySet[];
}

export interface ExerciseHistoryResponse {
  exercise: {
    id: string;
    name: string;
    exerciseCategory: string;
    muscleGroup: string | null;
  };
  entries: ExerciseHistoryEntry[];
}
