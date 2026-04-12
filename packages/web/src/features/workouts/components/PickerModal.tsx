import { useEffect, useRef } from "react";

export function PickerModal({
  title,
  options,
  current,
  onSelect,
  onClose,
}: {
  title: string;
  options: string[];
  current: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        ref={ref}
        className="bg-white rounded-2xl border border-gray-200/70 p-6 w-72 shadow-xl"
      >
        <h3 className="text-[15px] font-medium text-gray-900 mb-4">{title}</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={`py-2 text-center rounded-xl border text-[13px] cursor-pointer transition-colors ${
                opt === current
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 bg-transparent text-[13px] text-gray-400 cursor-pointer hover:border-gray-300 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
