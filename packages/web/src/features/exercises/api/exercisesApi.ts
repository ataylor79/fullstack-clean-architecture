import type {
  CreateExerciseDto,
  Exercise,
  UpdateExerciseDto,
} from "@workout-app/shared";

const BASE = "/api/exercises";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const exercisesApi = {
  getAll: () => request<Exercise[]>(BASE),
  getById: (id: string) => request<Exercise>(`${BASE}/${id}`),
  create: (dto: CreateExerciseDto) =>
    request<Exercise>(BASE, { method: "POST", body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateExerciseDto) =>
    request<Exercise>(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
  delete: (id: string) => request<void>(`${BASE}/${id}`, { method: "DELETE" }),
};
