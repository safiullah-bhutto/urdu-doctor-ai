# اردو ڈاکٹر AI — Urdu Doctor AI

Urdu-first AI health assistant with text + voice chat, built for the Alibaba Cloud AI Hackathon.
Powered by **Qwen (Alibaba Cloud Model Studio / DashScope)** for reasoning.

## Stack
- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Alibaba Cloud Model Studio (DashScope)** — `qwen-plus` via OpenAI-compatible endpoint for chat
- **Web Speech API** (browser-native) — voice input (`ur-PK`) and voice output, for a fast, demo-reliable loop

## Setup

```bash
npm install
cp .env.example .env.local
# paste your DASHSCOPE_API_KEY into .env.local
npm run dev
```

Open http://localhost:3000 — use Chrome for best voice support.

## Get a DashScope API Key
1. Sign up at Alibaba Cloud Model Studio (Bailian): https://bailian.console.alibabacloud.com
2. Create an API key under **API-KEY management**
3. Paste it into `.env.local` as `DASHSCOPE_API_KEY`

## Project structure
```
app/
  page.tsx           -> main chat screen
  api/chat/route.ts   -> calls Qwen via DashScope OpenAI-compatible API
  globals.css         -> design tokens, fonts (Noto Nastaliq Urdu + Inter)
components/
  ChatWindow.tsx       -> message list + input bar
  QuickPrompts.tsx     -> tappable symptom chips (بخار، سر درد، وغیرہ)
  MicButton.tsx         -> voice input button
```

## Cloud Voice Upgrade (bonus points for hackathon judging)
The current build uses the browser's Web Speech API for voice — zero setup, works offline of
extra API calls, great for a live demo. To score extra points for deeper Alibaba Cloud
integration, swap this for DashScope's native audio models:

- **ASR:** `fun-asr` / `paraformer-realtime-v2` (Alibaba Cloud Model Studio > Audio > Recognition)
  Docs: https://www.alibabacloud.com/help/en/model-studio/recording-file-recognition
- **TTS:** `cosyvoice-v2` / `cosyvoice-v3` (Alibaba Cloud Model Studio > Audio > Speech Synthesis)
  Docs: https://www.alibabacloud.com/help/en/model-studio/text-to-speech

Both are WebSocket/async-task based rather than simple REST, so budget extra time to wire them up
via the `dashscope` SDK, and verify current model/voice availability for Urdu before the demo —
availability changes over time.

## Roadmap (next steps)
1. ✅ Phase 1–3: Chat UI, quick prompts, voice (this build)
2. Phase 4: Symptom-triage structure (structured cause / home-care / red-flag sections in replies)
3. Phase 5: Emergency keyword detection + prominent escalation banner
4. Phase 6: Deploy on Alibaba Cloud (Function Compute / ECS) + custom domain
5. Phase 7: Pitch deck (problem → demo → architecture → impact → roadmap)

## Safety note
This is an AI assistant, not a medical professional. The UI includes a persistent disclaimer and
the system prompt instructs the model to always recommend professional care for serious symptoms.
