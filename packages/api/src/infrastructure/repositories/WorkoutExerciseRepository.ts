import type { WorkoutExercise } from "@domain/entities/WorkoutExercise";
import type { IWorkoutExerciseRepository } from "@domain/repositories/IWorkoutExerciseRepository";
import { db } from "@infrastructure/database/db";

interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  section: string;
  order_index: number;
  created_at: Date;
}

function toEntity(row: WorkoutExerciseRow): WorkoutExercise {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    section: row.section as WorkoutExercise["section"],
    orderIndex: row.order_index,
    createdAt: row.created_at,
  };
}

export function createWorkoutExerciseRepository(): IWorkoutExerciseRepository {
  return {
    async createMany(entries) {
      if (entries.length === 0) return [];
      const rows = await db<WorkoutExerciseRow>("workout_exercises")
        .insert(
          entries.map((e) => ({
            workout_id: e.workoutId,
            exercise_id: e.exerciseId,
            section: e.section,
            order_index: e.orderIndex,
          })),
        )
        .returning("*");
      return rows.map(toEntity);
    },

    async findByWorkoutId(workoutId) {
      const rows = await db<WorkoutExerciseRow>("workout_exercises")
        .where({ workout_id: workoutId })
        .orderBy("order_index", "asc");
      return rows.map(toEntity);
    },

    async replaceForWorkout(workoutId, entries) {
      return db.transaction(async (trx) => {
        await trx("workout_exercises")
          .where({ workout_id: workoutId })
          .delete();
        if (entries.length === 0) return [];
        const rows = await trx<WorkoutExerciseRow>("workout_exercises")
          .insert(
            entries.map((e) => ({
              workout_id: workoutId,
              exercise_id: e.exerciseId,
              section: e.section,
              order_index: e.orderIndex,
            })),
          )
          .returning("*");
        return rows.map(toEntity);
      });
    },
  };
}
