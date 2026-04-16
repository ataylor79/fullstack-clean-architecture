import { ExerciseCategory, type Exercise } from "@domain/entities/Exercise";
import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import { db } from "@infrastructure/database/db";

interface ExerciseRow {
  id: string;
  name: string;
  exercise_category: string;
  muscle_group: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    exerciseCategory: row.exercise_category as ExerciseCategory,
    muscleGroup: row.muscle_group,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createExerciseRepository(): IExerciseRepository {
  return {
    async findAll() {
      const rows = await db<ExerciseRow>("exercises")
        .orderBy("name")
        .limit(100);
      return rows.map(toEntity);
    },

    async findById(id) {
      const row = await db<ExerciseRow>("exercises").where({ id }).first();
      return row ? toEntity(row) : null;
    },

    async create(data) {
      const [row] = await db<ExerciseRow>("exercises")
        .insert({
          name: data.name,
          exercise_category: data.exerciseCategory,
          muscle_group: data.muscleGroup ?? null,
          notes: data.notes,
        })
        .returning("*");
      return toEntity(row);
    },

    async update(id, data) {
      const [row] = await db<ExerciseRow>("exercises")
        .where({ id })
        .update({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.exerciseCategory !== undefined && {
            exercise_category: data.exerciseCategory,
          }),
          ...(data.muscleGroup !== undefined && {
            muscle_group: data.muscleGroup,
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
          updated_at: new Date(),
        })
        .returning("*");
      return row ? toEntity(row) : null;
    },

    async delete(id) {
      const count = await db("exercises").where({ id }).delete();
      return count > 0;
    },
  };
}
