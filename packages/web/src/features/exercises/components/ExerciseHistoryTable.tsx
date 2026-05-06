import { format } from "date-fns";
import { useState } from "react";
import type {
  CardioHistorySet,
  ExerciseHistoryEntry,
  HiitHistorySet,
  HistorySet,
  MindBodyHistorySet,
  StrengthHistorySet,
} from "@workout-app/shared";

interface Props {
  entries: ExerciseHistoryEntry[];
}

function SetDetail({ set }: { set: HistorySet }) {
  switch (set.setType) {
    case "strength": {
      const s = set as StrengthHistorySet;
      return (
        <tr className="text-sm text-gray-600">
          <td className="py-1 pr-4">Set {s.setNumber}</td>
          <td className="py-1 pr-4">{s.reps} reps</td>
          <td className="py-1 pr-4">{s.weightKg} kg</td>
          <td className="py-1">{s.restSeconds != null ? `${s.restSeconds}s rest` : "—"}</td>
        </tr>
      );
    }
    case "cardio": {
      const s = set as CardioHistorySet;
      return (
        <tr className="text-sm text-gray-600">
          <td className="py-1 pr-4">Set {s.setNumber}</td>
          <td className="py-1 pr-4">
            {s.distanceMeters != null ? `${s.distanceMeters}m` : "—"}
          </td>
          <td className="py-1 pr-4">{s.durationSeconds}s</td>
          <td className="py-1">Intensity {s.intensityLevel}/10</td>
        </tr>
      );
    }
    case "hiit": {
      const s = set as HiitHistorySet;
      return (
        <tr className="text-sm text-gray-600">
          <td className="py-1 pr-4">Set {s.setNumber}</td>
          <td className="py-1 pr-4">{s.durationSeconds}s</td>
          <td className="py-1">
            {s.restSeconds != null ? `${s.restSeconds}s rest` : "—"}
          </td>
          <td className="py-1" />
        </tr>
      );
    }
    default: {
      const s = set as MindBodyHistorySet;
      return (
        <tr className="text-sm text-gray-600">
          <td className="py-1 pr-4">Set {s.setNumber}</td>
          <td className="py-1 pr-4">
            {s.durationSeconds != null ? `${s.durationSeconds}s` : "—"}
          </td>
          <td className="py-1">{s.reps != null ? `${s.reps} reps` : "—"}</td>
          <td className="py-1" />
        </tr>
      );
    }
  }
}

function EntryRow({ entry }: { entry: ExerciseHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-3 pr-4 text-sm text-gray-700">
          {format(new Date(entry.completedAt), "MMM d, yyyy")}
        </td>
        <td className="py-3 pr-4 text-sm font-medium text-gray-900">
          {entry.workoutName}
        </td>
        <td className="py-3 pr-4 text-sm text-gray-500">
          {entry.sets.length} {entry.sets.length === 1 ? "set" : "sets"}
        </td>
        <td className="py-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? "Hide" : "Show sets"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="pb-3 pl-4">
            <table className="w-full">
              <tbody>
                {entry.sets.map((set) => (
                  <SetDetail key={set.id} set={set} />
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

export function ExerciseHistoryTable({ entries }: Props) {
  if (entries.length === 0) return null;

  // newest first in table
  const sorted = [...entries].reverse();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Date
            </th>
            <th className="pb-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Workout
            </th>
            <th className="pb-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Sets
            </th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <EntryRow key={entry.workoutId} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
