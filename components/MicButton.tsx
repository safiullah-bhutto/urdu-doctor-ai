"use client";

import { useRef, useState } from "react";

// Uses the browser's native SpeechRecognition (Web Speech API) with lang="ur-PK".
// This keeps the voice loop fast and demo-reliable without extra server round trips.
// For a "full cloud" version using Alibaba Cloud DashScope Paraformer/Fun-ASR,
// see README.md > "Cloud Voice Upgrade".
export default function MicButton({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const getRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ur-PK";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    return recognition;
  };

  const startRecording = (lang: string = "ur-PK") => {
    const recognition = getRecognition();
    if (!recognition) {
      alert("یہ براؤزر آواز کی سہولت سپورٹ نہیں کرتا۔ براہ کرم Chrome استعمال کریں۔");
      return;
    }
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setRecording(false);

      if (event.error === "language-not-supported" && lang === "ur-PK") {
        // Some Chrome builds don't ship ur-PK speech recognition — retry with a
        // broader tag some browsers do support.
        startRecording("ur");
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        alert("مائیک کی اجازت نہیں ملی۔ براؤزر کے ایڈریس بار میں مائیک آئیکن پر کلک کر کے اجازت دیں۔");
      } else if (event.error === "no-speech") {
        // User didn't say anything — no need for a scary alert, just stop quietly.
      } else if (event.error === "network") {
        alert("انٹرنیٹ کنکشن کا مسئلہ ہے۔ آواز کی شناخت کے لیے انٹرنیٹ ضروری ہے۔");
      } else {
        alert("آواز ریکارڈ نہیں ہو سکی (" + event.error + ")۔ دوبارہ کوشش کریں۔");
      }
    };
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={recording ? stopRecording : () => startRecording()}
      aria-pressed={recording}
      aria-label={recording ? "ریکارڈنگ روکیں" : "بولنا شروع کریں"}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        recording ? "bg-alert text-white mic-active" : "bg-amber text-charcoal hover:bg-amber-dark"
      }`}
    >
      {recording ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );
}
