import type { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
import type { WorkoutTemplate } from "@domain/entities/WorkoutTemplate";
import type { IWorkoutTemplateRepository } from "@domain/repositories/IWorkoutTemplateRepository";
import { db } from "@infrastructure/database/db";

interface WorkoutTemplateRow {
  id: string;
  user_id: string;
  name: string;
  difficulty: WorkoutDifficulty;
  type: WorkoutType;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function toEntity(row: WorkoutTemplateRow): WorkoutTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    difficulty: row.difficulty,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createWorkoutTemplateRepository(): IWorkoutTemplateRepository {
  return {
    async findAll(userId) {
      const rows = await db<WorkoutTemplateRow>("workout_templates")
        .where({ user_id: userId })
        .whereNull("deleted_at")
        .orderBy("created_at", "desc");
      return rows.map(toEntity);
    },

    async findById(id, userId) {
      const row = await db<WorkoutTemplateRow>("workout_templates")
        .where({ id, user_id: userId })
        .whereNull("deleted_at")
        .first();
      return row ? toEntity(row) : null;
    },

    async create(data) {
      const [row] = await db<WorkoutTemplateRow>("workout_templates")
        .insert({
          user_id: data.userId,
          name: data.name,
          difficulty: data.difficulty,
          type: data.type,
        })
        .returning("*");
      return toEntity(row);
    },

    async update(id, userId, data) {
      const [row] = await db<WorkoutTemplateRow>("workout_templates")
        .where({ id, user_id: userId })
        .whereNull("deleted_at")
        .update({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
          ...(data.type !== undefined && { type: data.type }),
          updated_at: new Date(),
        })
        .returning("*");
      return row ? toEntity(row) : null;
    },

    async delete(id, userId) {
      const count = await db("workout_templates")
        .where({ id, user_id: userId })
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });
      return count > 0;
    },
  };
}
