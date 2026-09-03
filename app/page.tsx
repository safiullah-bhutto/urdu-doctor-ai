"use client";

import { useState } from "react";
import ChatWindow, { ChatMessage } from "@/components/ChatWindow";
import QuickPrompts from "@/components/QuickPrompts";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);

  const pushMessage = (role: ChatMessage["role"], text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
  };

  const speakReply = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ur-PK";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const PHYSICAL_EMERGENCY_MESSAGE =
  "⚠️ یہ علامات سنگین ہو سکتی ہیں۔ براہ کرم فوری طور پر ہسپتال جائیں یا ریسکیو 1122 پر کال کریں۔";

const MENTAL_HEALTH_CRISIS_MESSAGE =
  "⚠️ آپ جو محسوس کر رہے ہیں وہ بہت مشکل ہے، اور آپ اکیلے نہیں ہیں۔ براہ کرم ابھی کسی سے بات کریں:\nروزن (خودکشی سے بچاؤ): 0800-22444\nامنگ ذہنی صحت ہیلپ لائن: www.umang.com.pk\nاگر فوری خطرہ ہے تو قریبی ہسپتال جائیں یا 1122 پر کال کریں۔";

const sendToAssistant = async (text: string) => {
    if (!text.trim() || loading) return;
    pushMessage("user", text);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", text }].map((m) => ({
            role: m.role,
            content: m.text,
          })),
        }),
      });
      const data = await res.json();

      if (data.emergency === "mental") {
        pushMessage("alert", MENTAL_HEALTH_CRISIS_MESSAGE);
      } else if (data.emergency === "physical") {
        pushMessage("alert", PHYSICAL_EMERGENCY_MESSAGE);
      }

      const reply = data.reply || "معذرت، ابھی جواب نہیں دے سکا۔ دوبارہ کوشش کریں۔";
      pushMessage("assistant", reply);
      if (voiceReplyEnabled) speakReply(reply);
    } catch (err) {
      console.error(err);
      pushMessage("assistant", "معذرت، سرور سے رابطہ نہیں ہو سکا۔");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full py-0 sm:py-8 flex items-center justify-center">
      <main className="mx-auto flex h-dvh sm:h-[85vh] sm:max-h-[780px] w-full max-w-2xl flex-col bg-ivory sm:rounded-3xl sm:shadow-[0_20px_60px_-15px_rgba(11,79,63,0.25)] overflow-hidden border border-emerald/10">
        <header className="border-b border-emerald/10 bg-white px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <h1 className="font-nastaliq font-bold text-2xl text-emerald leading-none">اردو ڈاکٹر AI</h1>
            <button
              onClick={() => setVoiceReplyEnabled((v) => !v)}
              className={`text-[11px] rounded-full border px-2.5 py-1 transition-colors shrink-0 ${
                voiceReplyEnabled
                  ? "border-emerald bg-emerald/10 text-emerald"
                  : "border-charcoal/20 text-charcoal/40"
              }`}
            >
              {voiceReplyEnabled ? "آواز فعال" : "آواز بند"}
            </button>
          </div>
          <p className="text-xs text-charcoal/70 mt-1.5">آپ کی زبان میں، آپ کا پہلا صحت مشیر</p>
        </header>

        <div className="flex items-center justify-center gap-2 bg-alert/5 border-b border-alert/15 px-4 py-2.5 text-center text-[13.5px] text-alert font-nastaliq">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>یہ ایک AI معاون ہے، ڈاکٹر کا متبادل نہیں۔ شدید علامات میں فوری طبی امداد حاصل کریں۔</span>
        </div>

        <QuickPrompts onSelect={sendToAssistant} disabled={loading} />

        <ChatWindow
          messages={messages}
          loading={loading}
          onSend={sendToAssistant}
          onTranscript={sendToAssistant}
        />

        <div className="flex items-center justify-center gap-1.5 border-t border-emerald/10 bg-white py-2 text-xs text-charcoal/45">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          Powered by Qwen — Alibaba Cloud Model Studio
        </div>
      </main>
    </div>
  );
}
