import type { ExerciseCategory } from "@domain/entities/Exercise";
import type { SetType, WorkoutSet } from "@domain/entities/Set";
import type {
  ISetRepository,
  WorkoutSetWithExercise,
} from "@domain/repositories/ISetRepository";
import { db } from "@infrastructure/database/db";

interface SetRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  set_type: string;
  details: Record<string, unknown>;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface SetWithExerciseRow extends SetRow {
  exercise_name: string;
  exercise_muscle_group: string | null;
  exercise_exercise_category: string;
}

type BaseEntity = Omit<
  WorkoutSet,
  | "setType"
  | "reps"
  | "weightKg"
  | "restSeconds"
  | "distanceMeters"
  | "durationSeconds"
  | "intensityLevel"
>;

type ToEntityMap = {
  [K in SetType]: (
    base: BaseEntity,
    d: Record<string, unknown>,
    setType: K,
  ) => WorkoutSet;
};

const TO_ENTITY_RULES: ToEntityMap = {
  strength: (base, d) => ({
    ...base,
    setType: "strength",
    reps: d.reps as number,
    weightKg: d.weightKg as number,
    restSeconds: (d.restSeconds as number | null) ?? null,
  }),
  cardio: (base, d) => ({
    ...base,
    setType: "cardio",
    distanceMeters: (d.distanceMeters as number | null) ?? null,
    durationSeconds: d.durationSeconds as number,
    intensityLevel: d.intensityLevel as number,
  }),
  hiit: (base, d) => ({
    ...base,
    setType: "hiit",
    durationSeconds: d.durationSeconds as number,
    restSeconds: (d.restSeconds as number | null) ?? null,
  }),
  yoga: (base, d, setType) => ({
    ...base,
    setType,
    durationSeconds: (d.durationSeconds as number | null) ?? null,
    reps: (d.reps as number | null) ?? null,
  }),
  pilates: (base, d, setType) => ({
    ...base,
    setType,
    durationSeconds: (d.durationSeconds as number | null) ?? null,
    reps: (d.reps as number | null) ?? null,
  }),
  mobility: (base, d, setType) => ({
    ...base,
    setType,
    durationSeconds: (d.durationSeconds as number | null) ?? null,
    reps: (d.reps as number | null) ?? null,
  }),
};

function toEntity(row: SetRow): WorkoutSet {
  const base = {
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    setNumber: row.set_number,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  const setType = row.set_type as SetType;
  return (
    TO_ENTITY_RULES[setType] as (
      base: BaseEntity,
      d: Record<string, unknown>,
      setType: SetType,
    ) => WorkoutSet
  )(base, row.details, setType);
}

// yoga/pilates/mobility share one WorkoutSet union variant (setType: "yoga" | "pilates" | "mobility"),
// so Extract<WorkoutSet, { setType: "yoga" }> would be `never`. This helper maps each key to its variant.
type WorkoutSetForType<K extends SetType> = Extract<
  WorkoutSet,
  {
    setType: K extends "yoga" | "pilates" | "mobility"
      ? "yoga" | "pilates" | "mobility"
      : K;
  }
>;

type BuildDetailsMap = {
  [K in SetType]: (data: WorkoutSetForType<K>) => Record<string, unknown>;
};

const BUILD_DETAILS_RULES: BuildDetailsMap = {
  strength: (data) => ({
    reps: data.reps,
    weightKg: data.weightKg,
    restSeconds: data.restSeconds ?? null,
  }),
  cardio: (data) => ({
    distanceMeters: data.distanceMeters ?? null,
    durationSeconds: data.durationSeconds,
    intensityLevel: data.intensityLevel,
  }),
  hiit: (data) => ({
    durationSeconds: data.durationSeconds,
    restSeconds: data.restSeconds ?? null,
  }),
  yoga: (data) => ({
    durationSeconds: data.durationSeconds ?? null,
    reps: data.reps ?? null,
  }),
  pilates: (data) => ({
    durationSeconds: data.durationSeconds ?? null,
    reps: data.reps ?? null,
  }),
  mobility: (data) => ({
    durationSeconds: data.durationSeconds ?? null,
    reps: data.reps ?? null,
  }),
};

function buildDetails(data: WorkoutSet): Record<string, unknown> {
  return (
    BUILD_DETAILS_RULES[data.setType] as (
      data: WorkoutSet,
    ) => Record<string, unknown>
  )(data);
}

export function createSetRepository(): ISetRepository {
  return {
    async findByWorkoutId(workoutId): Promise<WorkoutSetWithExercise[]> {
      const rows = await db<SetWithExerciseRow>("workout_sets")
        .join("exercises", "workout_sets.exercise_id", "exercises.id")
        .where("workout_sets.workout_id", workoutId)
        .orderBy("workout_sets.set_number", "asc")
        .select(
          "workout_sets.*",
          "exercises.name as exercise_name",
          "exercises.muscle_group as exercise_muscle_group",
          "exercises.exercise_category as exercise_exercise_category",
        );

      return rows.map((row) => ({
        ...toEntity(row),
        exercise: {
          name: row.exercise_name,
          muscleGroup: row.exercise_muscle_group,
          exerciseCategory: row.exercise_exercise_category as ExerciseCategory,
        },
      }));
    },

    async findById(id, workoutId) {
      const row = await db<SetRow>("workout_sets")
        .where({ id, workout_id: workoutId })
        .first();
      return row ? toEntity(row) : null;
    },

    async create(data) {
      const [row] = await db("workout_sets")
        .insert({
          workout_id: data.workoutId,
          exercise_id: data.exerciseId,
          set_number: data.setNumber,
          set_type: data.setType,
          details: JSON.stringify(buildDetails(data as WorkoutSet)),
          notes: data.notes ?? null,
        })
        .returning("*");
      return toEntity(row as SetRow);
    },

    async update(id, workoutId, data) {
      const detailsPatch: Record<string, unknown> = {};
      if ("reps" in data && data.reps !== undefined)
        detailsPatch.reps = data.reps;
      if ("weightKg" in data && data.weightKg !== undefined)
        detailsPatch.weightKg = data.weightKg;
      if ("restSeconds" in data && data.restSeconds !== undefined)
        detailsPatch.restSeconds = data.restSeconds;
      if ("distanceMeters" in data && data.distanceMeters !== undefined)
        detailsPatch.distanceMeters = data.distanceMeters;
      if ("durationSeconds" in data && data.durationSeconds !== undefined)
        detailsPatch.durationSeconds = data.durationSeconds;
      if ("intensityLevel" in data && data.intensityLevel !== undefined)
        detailsPatch.intensityLevel = data.intensityLevel;

      const [row] = await db("workout_sets")
        .where({ id, workout_id: workoutId })
        .update({
          ...("exerciseId" in data &&
            data.exerciseId !== undefined && {
              exercise_id: data.exerciseId,
            }),
          ...("setNumber" in data &&
            data.setNumber !== undefined && {
              set_number: data.setNumber,
            }),
          ...(Object.keys(detailsPatch).length > 0 && {
            details: db.raw("details || ?::jsonb", [
              JSON.stringify(detailsPatch),
            ]),
          }),
          ...("notes" in data &&
            data.notes !== undefined && { notes: data.notes }),
          updated_at: new Date(),
        })
        .returning("*");
      return row ? toEntity(row as SetRow) : null;
    },

    async delete(id, workoutId) {
      const count = await db("workout_sets")
        .where({ id, workout_id: workoutId })
        .delete();
      return count > 0;
    },

    async existsByWorkoutId(workoutId) {
      const row = await db("workout_sets")
        .where({ workout_id: workoutId })
        .first("id");
      return row !== undefined;
    },
  };
}
