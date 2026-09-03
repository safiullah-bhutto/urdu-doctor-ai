import { NextRequest, NextResponse } from "next/server";

// Alibaba Cloud Model Studio (DashScope) — OpenAI-compatible endpoint.
// Docs: https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions
// Get your API key from Model Studio console and set DASHSCOPE_API_KEY in .env.local
const DASHSCOPE_BASE_URL =
  process.env.DASHSCOPE_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const MODEL = process.env.DASHSCOPE_MODEL || "qwen-plus";

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

// Server-side emergency detection — deterministic, doesn't rely on the model.
// Keeps this reliable even if the model's own reply misses a red flag.
// Uses word-combination matching (not rigid exact phrases) + Unicode normalization,
// since Urdu text can use different code points for visually-identical letters
// (e.g. Arabic Yeh U+064A vs Urdu Yeh U+06CC) depending on keyboard/input method.
function normalize(text: string): string {
  return text
    .replace(/\u064A/g, "\u06CC") // Arabic Yeh -> Urdu Yeh
    .replace(/\u0643/g, "\u06A9") // Arabic Kaf -> Urdu Kaf
    .replace(/[\u064B-\u065F\u0670]/g, "") // strip diacritics
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
    const apiKey = process.env.DASHSCOPE_API_KEY;
    const latestUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
    const emergency = latestUserMessage ? detectEmergency(latestUserMessage.content) : null;

    if (!apiKey) {
      return NextResponse.json(
        { reply: "سرور پر API key سیٹ نہیں ہے۔ .env.local میں DASHSCOPE_API_KEY شامل کریں۔", emergency },
        { status: 200 }
      );
    }

    const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DashScope error:", errText);
      return NextResponse.json(
        { reply: "معذرت، ابھی سرور جواب نہیں دے سکا۔ دوبارہ کوشش کریں۔", emergency },
        { status: 200 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "معذرت، جواب نہیں مل سکا۔";

    return NextResponse.json({ reply, emergency });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { reply: "معذرت، کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔", emergency: null },
      { status: 200 }
    );
  }
}
