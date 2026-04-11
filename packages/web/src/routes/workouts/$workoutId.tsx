import { createFileRoute } from "@tanstack/react-router";
import { WorkoutDetail } from "../../features/workouts/components/WorkoutDetail";

export const Route = createFileRoute("/workouts/$workoutId")({
  component: WorkoutDetail,
});
