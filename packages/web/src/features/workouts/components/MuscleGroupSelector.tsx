const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Core",
  "Legs",
  "Glutes",
  "Full Body",
];

export function MuscleGroupSelector({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (m: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MUSCLE_GROUPS.map((m) => {
        const sel = selected.has(m);
        return (
          <button
            key={m}
            type="button"
            onClick={() => onToggle(m)}
            className={`px-3.5 py-1.5 rounded-full border text-[13px] cursor-pointer transition-all select-none ${
              sel
                ? "bg-[#e85d2f] border-[#e85d2f] text-white"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
