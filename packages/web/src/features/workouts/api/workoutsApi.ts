import type { Workout, CreateWorkoutDto, UpdateWorkoutDto } from "@workout-app/shared";

const BASE = "/api/workouts";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const workoutsApi = {
  getAll: () => request<Workout[]>(BASE),
  getById: (id: string) => request<Workout>(`${BASE}/${id}`),
  create: (dto: CreateWorkoutDto) =>
    request<Workout>(BASE, { method: "POST", body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateWorkoutDto) =>
    request<Workout>(`${BASE}/${id}`, { method: "PATCH", body: JSON.stringify(dto) }),
  delete: (id: string) => request<void>(`${BASE}/${id}`, { method: "DELETE" }),
};
