import type { Workout, WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import { db } from "@infrastructure/database/db";

interface WorkoutRow {
  id: string;
  user_id: string;
  name: string;
  duration_minutes: number;
  difficulty: WorkoutDifficulty;
  type: WorkoutType;
  scheduled_at: Date;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: WorkoutRow): Workout {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    difficulty: row.difficulty,
    type: row.type,
    scheduledAt: row.scheduled_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createWorkoutRepository(): IWorkoutRepository {
  return {
    async findAll(userId) {
      const rows = await db<WorkoutRow>("workouts")
        .where({ user_id: userId })
        .orderBy("scheduled_at", "desc")
        .limit(100);
      return rows.map(toEntity);
    },

    async findById(id, userId) {
      const row = await db<WorkoutRow>("workouts")
        .where({ id, user_id: userId })
        .first();
      return row ? toEntity(row) : null;
    },

    async create(data) {
      const [row] = await db<WorkoutRow>("workouts")
        .insert({
          user_id: data.userId,
          name: data.name,
          duration_minutes: data.durationMinutes,
          difficulty: data.difficulty,
          type: data.type,
          scheduled_at: data.scheduledAt,
          completed_at: data.completedAt,
        })
        .returning("*");
      return toEntity(row);
    },

    async update(id, userId, data) {
      const [row] = await db<WorkoutRow>("workouts")
        .where({ id, user_id: userId })
        .update({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.scheduledAt !== undefined && {
            scheduled_at: data.scheduledAt,
          }),
          ...(data.completedAt !== undefined && {
            completed_at: data.completedAt,
          }),
          ...(data.durationMinutes !== undefined && {
            duration_minutes: data.durationMinutes,
          }),
          ...(data.difficulty !== undefined && {
            difficulty: data.difficulty,
          }),
          ...(data.type !== undefined && { type: data.type }),
          updated_at: new Date(),
        })
        .returning("*");
      return row ? toEntity(row) : null;
    },

    async delete(id, userId) {
      const count = await db("workouts")
        .where({ id, user_id: userId })
        .delete();
      return count > 0;
    },
  };
}
