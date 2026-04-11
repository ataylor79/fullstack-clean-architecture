import { db } from "../database/db";
import type { IWorkoutRepository } from "../../domain/repositories/IWorkoutRepository";
import type { Workout } from "../../domain/entities/Workout";

interface WorkoutRow {
  id: string;
  name: string;
  scheduled_at: Date;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: WorkoutRow): Workout {
  return {
    id: row.id,
    name: row.name,
    scheduledAt: row.scheduled_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createWorkoutRepository(): IWorkoutRepository {
  return {
    async findAll() {
      const rows = await db<WorkoutRow>("workouts")
        .orderBy("scheduled_at", "desc")
        .limit(100);
      return rows.map(toEntity);
    },

    async findById(id) {
      const row = await db<WorkoutRow>("workouts").where({ id }).first();
      return row ? toEntity(row) : null;
    },

    async create(data) {
      const [row] = await db<WorkoutRow>("workouts")
        .insert({
          name: data.name,
          scheduled_at: data.scheduledAt,
          completed_at: data.completedAt,
        })
        .returning("*");
      return toEntity(row);
    },

    async update(id, data) {
      const [row] = await db<WorkoutRow>("workouts")
        .where({ id })
        .update({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.scheduledAt !== undefined && {
            scheduled_at: data.scheduledAt,
          }),
          ...(data.completedAt !== undefined && {
            completed_at: data.completedAt,
          }),
          updated_at: new Date(),
        })
        .returning("*");
      return row ? toEntity(row) : null;
    },

    async delete(id) {
      const count = await db("workouts").where({ id }).delete();
      return count > 0;
    },
  };
}
