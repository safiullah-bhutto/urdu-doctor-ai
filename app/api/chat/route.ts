import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"];

const SYSTEM_PROMPT = `آپ "اردو ڈاکٹر AI" ہیں، ایک ہمدرد اور محتاط صحت معاون۔ صرف اردو میں جواب دیں۔

جواب ہمیشہ اس ڈھانچے میں دیں (سادہ الفاظ میں، ہر سیکشن ایک سے دو مختصر جملوں میں):
ممکنہ وجہ: [...]
گھریلو دیکھ بھال: [...]
کب ڈاکٹر سے رجوع کریں: [...]

اصول:
1. مریض کی علامات غور سے سنیں اور ممکنہ وجوہات آسان الفاظ میں بتائیں۔
2. کبھی بھی حتمی تشخیص نہ دیں یا دوا کی exact مقدار تجویز نہ کریں — ہمیشہ مستند ڈاکٹر سے رجوع کرنے کا مشورہ شامل کریں۔
3. ہمدردانہ اور پرسکون لہجہ رکھیں، طبی اصطلاحات سے پرہیز کریں۔
4. اگر علامات سنگین ہوں تو "کب ڈاکٹر سے رجوع کریں" سیکشن میں واضح طور پر فوری ہسپتال جانے کی ہدایت دیں۔`;

function normalize(text: string): string {
  return text
    .replace(/\u064A/g, "\u06CC")
    .replace(/\u0643/g, "\u06A9")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function detectEmergency(rawText: string): "physical" | "mental" | null {
  const text = normalize(rawText);

  const mentalCrisis = includesAny(text, [
    "خودکشی", "خود کشی", "اپنے آپ کو نقصان", "خود کو نقصان",
    "زندہ نہیں رہنا", "مرنا چاہتا", "مرنا چاہتی", "خود کو ختم",
    "جینے کا دل نہیں", "جینا نہیں چاہتا", "جینا نہیں چاہتی",
  ]);
  if (mentalCrisis) return "mental";

  const chestPain = text.includes("سینے") && includesAny(text, ["درد", "دباؤ", "جکڑن", "بھاری پن"]);
  const breathing = text.includes("سانس") && includesAny(text, ["نہیں آ", "دشواری", "تنگی", "رک"]);
  const heavyBleeding = text.includes("خون") && includesAny(text, ["زیادہ", "شدید", "بہت", "بند نہیں"]);
  const unconscious = includesAny(text, ["بے ہوش", "بےہوش", "ہوش نہیں"]);
  const seizure = text.includes("دورہ") && !text.includes("دل کا دورہ");
  const heartAttack = text.includes("دل") && includesAny(text, ["دورہ", "شدید درد"]);
  const stroke = text.includes("فالج");
  const poisoning = includesAny(text, ["زہر کھا", "زہر پی", "زہر خوری"]);
  const severeBurn = text.includes("جل") && includesAny(text, ["گیا", "گئی", "شدید"]);
  const accident = includesAny(text, ["حادثہ", "ایکسیڈنٹ", "گاڑی کا ٹکراؤ"]);

  if (
    chestPain || breathing || heavyBleeding || unconscious ||
    seizure || heartAttack || stroke || poisoning || severeBurn || accident
  ) {
    return "physical";
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const latestUserMessage = [...messages].reverse().find((m: { role: string; content: string }) => m.role === "user");
    const emergency = latestUserMessage ? detectEmergency(latestUserMessage.content) : null;

    if (!apiKey) {
      return NextResponse.json(
        { reply: "سرور پر API key سیٹ نہیں ہے۔", emergency },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const geminiContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let lastError: unknown = null;

    for (const modelName of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: geminiContents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.4,
          },
        });

        if (response.text) {
          return NextResponse.json({ reply: response.text, emergency });
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next...`);
      }
    }

    console.error("All Gemini models failed:", lastError);
    return NextResponse.json(
      { reply: "معذرت، ابھی سرور جواب نہیں دے سکا۔ دوبارہ کوشش کریں۔", emergency },
      { status: 200 }
    );
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { reply: "معذرت، کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔", emergency: null },
      { status: 200 }
    );
  }
}
