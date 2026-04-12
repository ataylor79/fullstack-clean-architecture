import { useState } from "react";

export type Phase = "warm" | "main" | "cool";

export type ExerciseEntry = {
  id: string;
  name: string;
  // warm / cool phases use duration pill
  duration: string;
  // main phase uses sets + reps pills
  sets: string;
  reps: string;
};

function uid(): string {
  return Math.random().toString(36).slice(2);
}

export function useExercises() {
  const [exercises, setExercises] = useState<Record<Phase, ExerciseEntry[]>>(() => ({
    warm: [
      { id: uid(), name: "Hip circles", duration: "45 sec", sets: "3 sets", reps: "10 reps" },
      { id: uid(), name: "Leg swings", duration: "30 sec", sets: "3 sets", reps: "10 reps" },
      { id: uid(), name: "Glute bridges", duration: "60 sec", sets: "3 sets", reps: "10 reps" },
    ],
    main: [
      { id: uid(), name: "Barbell back squat", duration: "45 sec", sets: "4 sets", reps: "8 reps" },
      { id: uid(), name: "Romanian deadlift", duration: "45 sec", sets: "4 sets", reps: "10 reps" },
      { id: uid(), name: "Leg press", duration: "45 sec", sets: "3 sets", reps: "12 reps" },
    ],
    cool: [
      { id: uid(), name: "Standing quad stretch", duration: "45 sec", sets: "3 sets", reps: "10 reps" },
      { id: uid(), name: "Seated hamstring stretch", duration: "60 sec", sets: "3 sets", reps: "10 reps" },
      { id: uid(), name: "Child's pose", duration: "60 sec", sets: "3 sets", reps: "10 reps" },
    ],
  }));

  function add(phase: Phase) {
    setExercises((prev) => ({
      ...prev,
      [phase]: [...prev[phase], { id: uid(), name: "", duration: "30 sec", sets: "3 sets", reps: "10 reps" }],
    }));
  }

  function update(phase: Phase, id: string, patch: Partial<ExerciseEntry>) {
    setExercises((prev) => ({
      ...prev,
      [phase]: prev[phase].map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function remove(phase: Phase, id: string) {
    setExercises((prev) => ({
      ...prev,
      [phase]: prev[phase].filter((e) => e.id !== id),
    }));
  }

  return { exercises, add, update, remove };
}
