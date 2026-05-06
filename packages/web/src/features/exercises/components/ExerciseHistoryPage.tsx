import { Link, useParams } from "@tanstack/react-router";
import type { HistorySetType } from "@workout-app/shared";
import { useExerciseHistory } from "../hooks/useExercises";
import { ExerciseHistoryChart } from "./ExerciseHistoryChart";
import { ExerciseHistoryTable } from "./ExerciseHistoryTable";

export function ExerciseHistoryPage() {
  const { exerciseId } = useParams({
    from: "/exercises/$exerciseId/history",
  });
  const { data, isLoading, isError } = useExerciseHistory(exerciseId);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (isError || !data)
    return <p className="text-red-500">Failed to load exercise history.</p>;

  const { exercise, entries } = data;

  const dominantSetType: HistorySetType =
    (entries[0]?.sets[0]?.setType as HistorySetType) ?? "strength";

  return (
    <div>
      <Link
        to="/exercises"
        className="text-sm text-blue-600 hover:text-blue-800 mb-6 inline-block"
      >
        ← All Exercises
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {exercise.name}
      </h1>
      {exercise.muscleGroup && (
        <p className="text-sm text-gray-500 mb-6">{exercise.muscleGroup}</p>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Progress
        </h2>
        <ExerciseHistoryChart entries={entries} setType={dominantSetType} />
      </div>

      {entries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Session History
          </h2>
          <ExerciseHistoryTable entries={entries} />
        </div>
      )}
    </div>
  );
}
