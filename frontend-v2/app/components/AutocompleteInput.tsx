"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  label: string;
  value: string;
  placeholder: string;
  suggestions: string[];
  helper?: string;
  showSuggestionsOnFocus?: boolean;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
};

export default function AutocompleteInput({
  label,
  value,
  placeholder,
  suggestions,
  helper,
  showSuggestionsOnFocus = false,
  onChange,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const visibleSuggestions = useMemo(() => {
    if (!value.trim() && showSuggestionsOnFocus) {
      return suggestions.slice(0, 10);
    }

    if (!value.trim()) return [];

    return suggestions
      .filter((item) => item && item.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 10);
  }, [suggestions, value, showSuggestionsOnFocus]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-2 block text-sm font-black text-slate-800">
        {label}
      </label>

      <input
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />

      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}

      {open && visibleSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[76px] z-[2600] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {visibleSuggestions.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(item);
                onSelect?.(item);
                setOpen(false);
              }}
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
