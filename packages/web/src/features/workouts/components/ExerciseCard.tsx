import type { ExerciseEntry, Phase } from "../hooks/useExercises";

const SETS_OPTS = ["1 set", "2 sets", "3 sets", "4 sets", "5 sets", "6 sets"];
const REPS_OPTS = ["5 reps", "6 reps", "8 reps", "10 reps", "12 reps", "15 reps", "20 reps", "AMRAP"];
const DUR_OPTS = ["15 sec", "20 sec", "30 sec", "45 sec", "60 sec", "90 sec", "2 min", "3 min"];

const PILL_BASE_CN =
  "px-2.5 py-1 rounded-[5px] border text-[12px] cursor-pointer whitespace-nowrap transition-colors";
const PILL_GRAY_CN = `${PILL_BASE_CN} bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700`;
const PILL_COOL_CN = `${PILL_BASE_CN} bg-[#e6f1fb] border-[#b5d4f4] text-[#0c447c] hover:bg-[#b5d4f4]`;

function cycle(options: string[], current: string): string {
  const i = options.indexOf(current);
  return options[(i + 1) % options.length];
}

export function ExerciseCard({
  entry,
  index,
  phase,
  onUpdate,
  onDelete,
}: {
  entry: ExerciseEntry;
  index: number;
  phase: Phase;
  onUpdate: (patch: Partial<ExerciseEntry>) => void;
  onDelete: () => void;
}) {
  const isTime = phase === "warm" || phase === "cool";
  const timePillCn = phase === "cool" ? PILL_COOL_CN : PILL_GRAY_CN;

  return (
    <div className="bg-white border border-gray-200/70 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
      {/* drag handle */}
      <span className="text-gray-300 cursor-grab select-none text-sm leading-none flex-shrink-0">
        ⠿
      </span>

      {/* number badge */}
      <span className="w-[22px] h-[22px] rounded-[5px] bg-gray-100 flex items-center justify-center text-[11px] font-medium text-gray-400 flex-shrink-0">
        {index + 1}
      </span>

      {/* name input */}
      <input
        type="text"
        value={entry.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder={isTime ? "Stretch / movement…" : "Exercise name…"}
        className="flex-1 text-[14px] font-medium text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-300 placeholder:font-normal min-w-0"
      />

      {/* pills */}
      <div className="flex gap-1.5 flex-shrink-0">
        {isTime ? (
          <button
            type="button"
            onClick={() => onUpdate({ duration: cycle(DUR_OPTS, entry.duration) })}
            className={timePillCn}
          >
            {entry.duration}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onUpdate({ sets: cycle(SETS_OPTS, entry.sets) })}
              className={PILL_GRAY_CN}
            >
              {entry.sets}
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ reps: cycle(REPS_OPTS, entry.reps) })}
              className={PILL_GRAY_CN}
            >
              {entry.reps}
            </button>
          </>
        )}
      </div>

      {/* delete */}
      <button
        type="button"
        onClick={onDelete}
        className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0 text-base leading-none border-none bg-transparent cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}
