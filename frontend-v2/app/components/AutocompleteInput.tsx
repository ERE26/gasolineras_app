"use client";

type Props = { label: string; value: string; placeholder: string; suggestions: string[]; helper?: string; onChange: (value: string) => void; onSelect?: (value: string) => void };

export default function AutocompleteInput({ label, value, placeholder, suggestions, helper, onChange, onSelect }: Props) {
  const visibleSuggestions = suggestions.filter((item) => item && item.toLowerCase().includes(value.toLowerCase())).slice(0, 8);
  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-black text-slate-800">{label}</label>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
      {value.trim() && visibleSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[76px] z-[2000] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {visibleSuggestions.map((item) => (
            <button key={item} type="button" onClick={() => { onChange(item); onSelect?.(item); }} className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50">{item}</button>
          ))}
        </div>
      )}
    </div>
  );
}
