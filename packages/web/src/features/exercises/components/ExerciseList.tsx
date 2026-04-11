import { useExercises } from "../hooks/useExercises";

export function ExerciseList() {
  const { data: exercises, isLoading, isError } = useExercises();

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (isError) return <p className="text-red-500">Failed to load exercises.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Exercises</h1>

      {exercises?.length === 0 && (
        <p className="text-gray-500">No exercises yet.</p>
      )}

      <ul className="space-y-3">
        {exercises?.map((exercise) => (
          <li
            key={exercise.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <p className="font-medium text-gray-900">{exercise.name}</p>
            <p className="text-sm text-gray-500 mt-1">{exercise.muscleGroup}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
