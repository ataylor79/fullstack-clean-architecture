import type {
  Workout,
  WorkoutDifficulty,
  WorkoutType,
} from "@domain/entities/Workout";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import { db } from "@infrastructure/database/db";

interface WorkoutRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  name: string;
  duration_minutes: number | null;
  difficulty: WorkoutDifficulty;
  type: WorkoutType;
  scheduled_at: Date;
  completed_at: Date | null;
  rating: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: WorkoutRow): Workout {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    difficulty: row.difficulty,
    type: row.type,
    scheduledAt: row.scheduled_at,
    completedAt: row.completed_at,
    rating: row.rating,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createWorkoutRepository(): IWorkoutRepository {
  return {
    async findAll(userId, page, limit) {
      const offset = (page - 1) * limit;
      const [rows, countRow] = await Promise.all([
        db<WorkoutRow>("workouts")
          .where({ user_id: userId })
          .orderBy("scheduled_at", "desc")
          .limit(limit)
          .offset(offset),
        db("workouts")
          .where({ user_id: userId })
          .count("id as count")
          .first() as Promise<{ count: string } | undefined>,
      ]);
      return {
        data: rows.map(toEntity),
        total: Number(countRow?.count ?? 0),
      };
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
          plan_id: data.planId,
          name: data.name,
          duration_minutes: data.durationMinutes,
          difficulty: data.difficulty,
          type: data.type,
          scheduled_at: data.scheduledAt,
          completed_at: data.completedAt,
          rating: data.rating,
          notes: data.notes,
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
          ...(data.rating !== undefined && { rating: data.rating }),
          ...(data.notes !== undefined && { notes: data.notes }),
          updated_at: new Date(),
        })
        .returning("*");
      return row ? toEntity(row) : null;
    },

    async findByPlanId(planId, userId) {
      const rows = await db<WorkoutRow>("workouts")
        .where({ plan_id: planId, user_id: userId })
        .orderBy("scheduled_at", "asc");
      return rows.map(toEntity);
    },

    async delete(id, userId) {
      const count = await db("workouts")
        .where({ id, user_id: userId })
        .delete();
      return count > 0;
    },
  };
}
