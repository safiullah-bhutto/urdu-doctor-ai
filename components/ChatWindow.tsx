"use client";

import { useEffect, useRef, useState } from "react";
import MicButton from "./MicButton";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "alert";
  text: string;
};

export default function ChatWindow({
  messages,
  loading,
  onSend,
  onTranscript,
}: {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onTranscript: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
    const scrollToEnd = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

    scrollToEnd();
    const t1 = setTimeout(scrollToEnd, 120);
    const t2 = setTimeout(scrollToEnd, 400);

    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(scrollToEnd);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages, loading]); 

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    onSend(text);
    setInput("");
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
       <div className="chat-scroll flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="mx-auto max-w-sm text-center text-charcoal/50 font-nastaliq text-[17px] mt-10">
            آپ کیسا محسوس کر رہے ہیں؟ نیچے لکھیں، بولیں، یا کوئی سوال منتخب کریں۔
          </div>
        )}

        {messages.map((m) =>
          m.role === "alert" ? (
            <div key={m.id} className="flex justify-center">
              <div className="max-w-[92%] rounded-2xl border-2 border-alert bg-alert/10 px-4 py-3 font-nastaliq text-[16px] leading-relaxed text-alert whitespace-pre-line">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] whitespace-pre-line rounded-2xl px-4 py-2.5 font-nastaliq text-[17px] leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-amber text-charcoal rounded-tl-sm"
                    : "bg-emerald text-white rounded-tr-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[60%] rounded-2xl rounded-tr-sm bg-emerald/10 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-emerald/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-emerald/60 animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-emerald/10 bg-white px-3 sm:px-5 pt-4 pb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <MicButton onTranscript={onTranscript} disabled={loading} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            placeholder="یہاں لکھیں..."
            className="min-w-0 flex-1 rounded-full border border-emerald/20 bg-ivory pr-4 sm:pr-6 pl-4 sm:pl-5 py-3 font-nastaliq text-[16px] outline-none focus:border-emerald/50 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="بھیجیں"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald text-white hover:bg-emerald-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
