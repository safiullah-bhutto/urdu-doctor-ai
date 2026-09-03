"use client";

const PROMPTS = [
  "مجھے بخار ہے",
  "سر میں شدید درد ہے",
  "کھانسی اور گلے میں خراش ہے",
  "پیٹ میں درد ہو رہا ہے",
  "الرجی کی علامات ہیں",
  "نیند نہیں آ رہی",
];

export default function QuickPrompts({
  onSelect,
  disabled,
}: {
  onSelect: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5 px-4 pb-3 pt-1">
      {PROMPTS.map((p) => (
        <button
          key={p}
          disabled={disabled}
          onClick={() => onSelect(p)}
          className="whitespace-nowrap rounded-full border border-emerald/25 bg-white px-4 py-2 font-nastaliq text-[15px] text-emerald hover:bg-emerald hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
