import type { ExerciseEntry, Phase } from "../hooks/useExercises";
import { ExerciseCard } from "./ExerciseCard";

export type PhaseConfig = {
  phase: Phase;
  label: string;
  sub: string;
  addLabel: string;
  accent: string;
  headerBg: string;
  titleColor: string;
  subColor: string;
  iconBg: string;
  addHover: string;
  icon: React.ReactNode;
};

export const PHASE_CONFIGS: PhaseConfig[] = [
  {
    phase: "warm",
    label: "Warm-up",
    sub: "· get the body ready",
    addLabel: "Add warm-up exercise",
    accent: "#e8972f",
    headerBg: "#faeeda",
    titleColor: "#633806",
    subColor: "#854f0b",
    iconBg: "#e8972f",
    addHover: "hover:border-[#e8972f] hover:text-[#e8972f]",
    icon: (
      <svg viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" width="14" height="14">
        <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3 3l1.4 1.4M9.6 9.6l1.4 1.4M3 11l1.4-1.4M9.6 4.4l1.4-1.4" />
        <circle cx="7" cy="7" r="2.5" />
      </svg>
    ),
  },
  {
    phase: "main",
    label: "Main workout",
    sub: "· your working sets",
    addLabel: "Add exercise",
    accent: "#e85d2f",
    headerBg: "#faece7",
    titleColor: "#712b13",
    subColor: "#993c1d",
    iconBg: "#e85d2f",
    addHover: "hover:border-[#e85d2f] hover:text-[#e85d2f]",
    icon: (
      <svg viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
        <path d="M2 4v6M12 4v6M0 5.5h2M12 5.5h2M0 8.5h2M12 8.5h2" />
      </svg>
    ),
  },
  {
    phase: "cool",
    label: "Cool-down",
    sub: "· recover and stretch",
    addLabel: "Add cool-down exercise",
    accent: "#2f8ee8",
    headerBg: "#e6f1fb",
    titleColor: "#0c447c",
    subColor: "#185fa5",
    iconBg: "#2f8ee8",
    addHover: "hover:border-[#2f8ee8] hover:text-[#2f8ee8]",
    icon: (
      <svg viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" width="14" height="14">
        <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3 3l1.4 1.4M9.6 9.6l1.4 1.4M3 11l1.4-1.4M9.6 4.4l1.4-1.4" />
        <circle cx="7" cy="7" r="2.5" strokeDasharray="2 1.5" />
      </svg>
    ),
  },
];

export function PhaseBlock({
  config,
  exercises,
  onAdd,
  onUpdate,
  onDelete,
}: {
  config: PhaseConfig;
  exercises: ExerciseEntry[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<ExerciseEntry>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/70 overflow-hidden mb-6">
      {/* header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200/70"
        style={{ background: config.headerBg }}
      >
        <div
          className="w-7 h-7 rounded-[6px] flex items-center justify-center flex-shrink-0"
          style={{ background: config.iconBg }}
        >
          {config.icon}
        </div>
        <span className="text-[13px] font-medium" style={{ color: config.titleColor }}>
          {config.label}
        </span>
        <span className="text-[12px]" style={{ color: config.subColor }}>
          {config.sub}
        </span>
      </div>

      {/* body */}
      <div className="px-3 py-2.5 bg-white">
        <div className="flex flex-col gap-2">
          {exercises.map((entry, i) => (
            <ExerciseCard
              key={entry.id}
              entry={entry}
              index={i}
              phase={config.phase}
              onUpdate={(patch) => onUpdate(entry.id, patch)}
              onDelete={() => onDelete(entry.id)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onAdd}
          className={`w-full mt-2 py-2.5 rounded-xl border border-dashed border-gray-300 bg-transparent text-[13px] text-gray-400 cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${config.addHover}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="1" x2="6" y2="11" />
            <line x1="1" y1="6" x2="11" y2="6" />
          </svg>
          {config.addLabel}
        </button>
      </div>
    </div>
  );
}
