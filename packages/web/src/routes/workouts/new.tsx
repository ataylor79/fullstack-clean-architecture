import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MuscleGroupSelector } from "../../features/workouts/components/MuscleGroupSelector";
import {
  PHASE_CONFIGS,
  PhaseBlock,
} from "../../features/workouts/components/PhaseBlock";
import { PickerModal } from "../../features/workouts/components/PickerModal";
import type { ModalKey } from "../../features/workouts/components/WorkoutMetaGrid";
import { WorkoutMetaGrid } from "../../features/workouts/components/WorkoutMetaGrid";
import { useExercises } from "../../features/workouts/hooks/useExercises";
import { useCreateWorkout } from "../../features/workouts/hooks/useWorkouts";

export const Route = createFileRoute("/workouts/new")({
  component: NewWorkoutPage,
});

// ---------------------------------------------------------------------------
// Constants (only used inside this page)
// ---------------------------------------------------------------------------

const DURATION_OPTIONS = [
  "15 min",
  "20 min",
  "30 min",
  "45 min",
  "60 min",
  "75 min",
  "90 min",
];
const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Elite"];
const TYPE_OPTIONS = [
  "Strength",
  "Cardio",
  "HIIT",
  "Yoga",
  "Pilates",
  "Mobility",
  "Hybrid",
];

function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Small single-use helpers kept here
// ---------------------------------------------------------------------------

function SectionDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: color }}
    />
  );
}

function NotesSection({
  notes,
  onChange,
}: {
  notes: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={notes}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      placeholder="Rest 60–90 sec between sets. Focus on form…"
      className="w-full resize-y border border-gray-200/70 rounded-xl px-3 py-2.5 text-[14px] text-gray-900 bg-white outline-none placeholder:text-gray-300 focus:border-gray-300 transition-colors font-sans"
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function NewWorkoutPage() {
  const navigate = useNavigate();
  const { mutate: createWorkout, isPending } = useCreateWorkout();

  // Form state
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState(defaultDate);
  const [duration, setDuration] = useState("45 min");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [workoutType, setWorkoutType] = useState("Strength");
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(
    new Set(),
  );
  const [notes, setNotes] = useState("");
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const {
    exercises,
    add: addExercise,
    update: updateExercise,
    remove: removeExercise,
  } = useExercises();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function toggleMuscle(m: string) {
    setSelectedMuscles((prev) => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });
  }

  const MODAL_CONFIG: Record<
    ModalKey,
    {
      title: string;
      options: string[];
      value: string;
      set: (v: string) => void;
    }
  > = {
    duration: {
      title: "Duration",
      options: DURATION_OPTIONS,
      value: duration,
      set: setDuration,
    },
    difficulty: {
      title: "Difficulty",
      options: DIFFICULTY_OPTIONS,
      value: difficulty,
      set: setDifficulty,
    },
    type: {
      title: "Workout type",
      options: TYPE_OPTIONS,
      value: workoutType,
      set: setWorkoutType,
    },
  };

  function handleSave() {
    if (!title.trim()) {
      showToast("Give your workout a name!");
      return;
    }
    const scheduledAt = new Date(`${scheduledDate}T09:00:00`);
    createWorkout(
      {
        name: title.trim(),
        scheduledAt,
        durationMinutes: parseInt(duration.split(" ")[0], 10),
        difficulty,
        type: workoutType,
      },
      {
        onSuccess: () => navigate({ to: "/workouts" }),
        onError: () => showToast("Failed to save. Please try again."),
      },
    );
  }

  return (
    <div className="font-sans max-w-[680px] py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center flex-shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e85d2f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="24"
            height="24"
            role="img"
            aria-label="logo"
          >
            <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-[32px] tracking-wide text-gray-900 leading-none m-0">
            Workout Builder
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">
            Design your full session from warm-up to cool-down
          </p>
        </div>
      </div>

      {/* Title input */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2.5">
          <SectionDot color="#e85d2f" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
            Workout title
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name your workout…"
          maxLength={60}
          className="w-full font-display text-[28px] tracking-wide bg-transparent border-0 border-b-2 border-gray-200 text-gray-900 pb-1.5 outline-none placeholder:text-gray-300 focus:border-[#e85d2f] transition-colors"
        />
      </div>

      {/* Details */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2.5">
          <SectionDot color="#e85d2f" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
            Details
          </span>
        </div>
        <WorkoutMetaGrid
          duration={duration}
          difficulty={difficulty}
          workoutType={workoutType}
          scheduledDate={scheduledDate}
          onScheduledDateChange={setScheduledDate}
          onOpenModal={setActiveModal}
        />
      </div>

      {/* Muscle groups */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2.5">
          <SectionDot color="#e85d2f" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
            Muscle groups
          </span>
        </div>
        <MuscleGroupSelector
          selected={selectedMuscles}
          onToggle={toggleMuscle}
        />
      </div>

      {/* Phase blocks */}
      {PHASE_CONFIGS.map((config) => (
        <PhaseBlock
          key={config.phase}
          config={config}
          exercises={exercises[config.phase]}
          onAdd={() => addExercise(config.phase)}
          onUpdate={(id, patch) => updateExercise(config.phase, id, patch)}
          onDelete={(id) => removeExercise(config.phase, id)}
        />
      ))}

      {/* Notes */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2.5">
          <SectionDot color="#e85d2f" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
            Notes
          </span>
        </div>
        <NotesSection notes={notes} onChange={setNotes} />
      </div>

      <hr className="border-0 border-t border-gray-100 my-7" />

      {/* Persisted fields notice */}
      <p className="text-[12px] text-gray-400 mb-4">
        Currently only{" "}
        <strong className="font-medium text-gray-500">workout name</strong> and{" "}
        <strong className="font-medium text-gray-500">scheduled date</strong>{" "}
        are saved. Exercise details, duration, difficulty, type, muscle groups,
        and notes will be persisted once the API is extended.
      </p>

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => navigate({ to: "/workouts" })}
          className="px-5 py-3.5 rounded-xl bg-transparent text-[14px] text-gray-700 border border-gray-200 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all font-sans"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 py-3.5 rounded-xl bg-[#1a1a1a] text-white text-[14px] font-medium border-none cursor-pointer hover:bg-[#e85d2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
        >
          {isPending ? "Saving…" : "Save workout"}
        </button>
      </div>

      {/* Picker modal */}
      {activeModal && (
        <PickerModal
          title={MODAL_CONFIG[activeModal].title}
          options={MODAL_CONFIG[activeModal].options}
          current={MODAL_CONFIG[activeModal].value}
          onSelect={(val) => MODAL_CONFIG[activeModal].set(val)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-full text-[13px] shadow-lg animate-fade-in pointer-events-none z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
