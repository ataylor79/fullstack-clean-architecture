import type { WorkoutSet } from "@domain/entities/Set";
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
  reps: number;
  weight_kg: string; // decimal comes back as string from pg
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface SetWithExerciseRow extends SetRow {
  exercise_name: string;
  exercise_muscle_group: string;
}

function toEntity(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    setNumber: row.set_number,
    reps: row.reps,
    weightKg: parseFloat(row.weight_kg),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
        );

      return rows.map((row) => ({
        ...toEntity(row),
        exercise: {
          name: row.exercise_name,
          muscleGroup: row.exercise_muscle_group,
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
          reps: data.reps,
          weight_kg: data.weightKg,
          notes: data.notes ?? null,
        })
        .returning("*");
      return toEntity(row as SetRow);
    },

    async update(id, workoutId, data) {
      const [row] = await db("workout_sets")
        .where({ id, workout_id: workoutId })
        .update({
          ...(data.exerciseId !== undefined && {
            exercise_id: data.exerciseId,
          }),
          ...(data.setNumber !== undefined && { set_number: data.setNumber }),
          ...(data.reps !== undefined && { reps: data.reps }),
          ...(data.weightKg !== undefined && { weight_kg: data.weightKg }),
          ...(data.notes !== undefined && { notes: data.notes }),
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
  };
}
