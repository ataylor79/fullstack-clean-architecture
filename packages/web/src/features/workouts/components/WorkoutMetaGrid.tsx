export type ModalKey = "duration" | "difficulty" | "type";

function MetaField({
  label,
  value,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-gray-50 border border-gray-200/70 rounded-xl px-3 py-2.5 text-left transition-colors hover:border-gray-300 cursor-pointer w-full"
    >
      <div className="text-[11px] text-gray-400 mb-1 uppercase tracking-wide font-medium">
        {label}
      </div>
      <div className="text-[15px] font-medium text-gray-900">{value}</div>
    </button>
  );
}

export function WorkoutMetaGrid({
  duration,
  difficulty,
  workoutType,
  scheduledDate,
  onScheduledDateChange,
  onOpenModal,
}: {
  duration: string;
  difficulty: string;
  workoutType: string;
  scheduledDate: string;
  onScheduledDateChange: (v: string) => void;
  onOpenModal: (key: ModalKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MetaField label="Duration" value={duration} onClick={() => onOpenModal("duration")} />
      <MetaField label="Difficulty" value={difficulty} onClick={() => onOpenModal("difficulty")} />
      <MetaField label="Type" value={workoutType} onClick={() => onOpenModal("type")} />
      <MetaField
        label="Scheduled"
        value={
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => onScheduledDateChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-[15px] font-medium text-gray-900 bg-transparent border-none outline-none w-full cursor-pointer"
          />
        }
      />
    </div>
  );
}
