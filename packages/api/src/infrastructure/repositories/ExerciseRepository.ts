import { db } from "../database/db";
import type { IExerciseRepository } from "../../domain/repositories/IExerciseRepository";
import type { Exercise } from "../../domain/entities/Exercise";

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
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
        .insert({ name: data.name, muscle_group: data.muscleGroup, notes: data.notes })
        .returning("*");
      return toEntity(row);
    },

    async update(id, data) {
      const [row] = await db<ExerciseRow>("exercises")
        .where({ id })
        .update({
          ...(data.name !== undefined && { name: data.name }),
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
