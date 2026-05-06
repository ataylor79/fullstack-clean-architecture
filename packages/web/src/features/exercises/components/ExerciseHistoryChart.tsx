import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CardioHistorySet,
  ExerciseHistoryEntry,
  HistorySetType,
  StrengthHistorySet,
} from "@workout-app/shared";

interface Props {
  entries: ExerciseHistoryEntry[];
  setType: HistorySetType;
}

function computeValue(entry: ExerciseHistoryEntry, setType: HistorySetType): number {
  const sets = entry.sets;
  if (sets.length === 0) return 0;

  switch (setType) {
    case "strength": {
      const vals = sets
        .filter((s): s is StrengthHistorySet => s.setType === "strength")
        .map((s) => s.weightKg);
      return vals.length > 0 ? Math.max(...vals) : 0;
    }
    case "cardio": {
      const vals = sets
        .filter((s): s is CardioHistorySet => s.setType === "cardio")
        .map((s) => s.distanceMeters ?? s.durationSeconds);
      return vals.length > 0 ? Math.max(...vals) : 0;
    }
    default: {
      return sets.reduce((acc, s) => {
        const dur = "durationSeconds" in s ? (s.durationSeconds ?? 0) : 0;
        return acc + dur;
      }, 0);
    }
  }
}

function yAxisUnit(setType: HistorySetType): string {
  if (setType === "strength") return "kg";
  if (setType === "cardio") return "m";
  return "s";
}

export function ExerciseHistoryChart({ entries, setType }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-8 text-center">
        No history yet. Complete a workout with this exercise to see your progress.
      </p>
    );
  }

  const data = entries.map((entry) => ({
    date: format(new Date(entry.completedAt), "MMM d"),
    value: computeValue(entry, setType),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
        />
        <YAxis
          unit={yAxisUnit(setType)}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip
          contentStyle={{ fontSize: 13, borderRadius: 8 }}
          formatter={(value) => [`${value} ${yAxisUnit(setType)}`, "Best"]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4, fill: "#3b82f6" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
