import { createFileRoute } from "@tanstack/react-router";
import { WorkoutList } from "../../features/workouts/components/WorkoutList";

export const Route = createFileRoute("/workouts/")({
  component: WorkoutList,
});
