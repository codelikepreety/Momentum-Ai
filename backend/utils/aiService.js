import { GoogleGenAI } from "@google/genai";

let client = null;
const getClient = () => {
  if (client) return client;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  client = new GoogleGenAI({ apiKey: key })
  return client;
};

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const isAIEnabled = () => !!process.env.GEMINI_API_KEY;

export const parseJSON = (text) => {
  let cleaned = (text || "").trim();
  if (cleaned.startsWith("```json")){
    cleaned = cleaned.replace(/```json\n?/g,"").replace(/```\n?/g,"")
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```\n?/g,"")
  }
  return JSON.parse(cleaned.trim())
}

export const chatCompletion = async ({ system, user, temperature = 0.7 }) => {
  const c = getClient();
  if (!c) {
    return {
      ok: false,
      content: "AI feature are disabled - set GEMINI_API_KEY in the backend .env to enable real AI responses."
    }
  }
  try {
    const res = await c.models.generateContent({
      model: MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        temperature,
      },
    });
    return { ok:true, content: (res.text || "").trim() };
  } catch (err) {
    console.error("AI error:", err.message);
    return { ok: false, content: "AI request failed. Please try again later." };
  }
};

export const SYSTEM_PROMPTS = {
  weekly: `
You are a warm, encouraging habit coach.

Analyze the user's last 7 days of habit data and write a short personalized report (120–180 words).

Mention:
- what went well
- what struggled
- patterns noticed
- one specific piece of encouragement

Use the user's actual habit names.
Be human and supportive, not generic.

Do not use markdown headers.
Use plain prose with natural line breaks.
`,

  suggestion: `
You are a helpful habit coach.

Based on the user's goals, productive time, and past struggles, suggest exactly 3 personalized habits.

Return ONLY valid JSON in this exact format:

{
  "suggestions": [
    {
      "name": "...",
      "description": "...",
      "frequency": "daily",
      "category": "Health",
      "icon": "💪"
    }
  ]
}

Rules:
- frequency must be either "daily" or "weekly"
- category must be one of:
  Health, Fitness, Learning, Mindfulness, Productivity, Social, Finance, Creative, Other
- icon must be a single emoji
- return no prose outside JSON
`,

  recovery: `
You are a compassionate habit recovery coach.

The user broke a streak.
Write a personalized 3-day recovery plan tailored to the specific habit.

Structure:
- short empathetic opening (1–2 sentences)
- Day 1 section with one concrete action
- Day 2 section with one concrete action
- Day 3 section with one concrete action
- short encouraging closing line

Tone:
Warm, practical, and motivating.
Avoid guilt or shame.

Length: 150–220 words.
`,

  chat: `
You are a helpful habit analysis assistant.

Answer the user's question using ONLY the provided habit data as context.

Be specific:
- mention actual habit names
- mention days, streaks, or percentages when available

Keep replies under 120 words.

If the data is insufficient, say so briefly instead of guessing.
`,

  morning: `
You are a warm, motivating friend.

Write a short morning motivation message (30–60 words).

Use the user's actual habit names and current streaks.
Mention 1–2 specific habits.

Tone:
Energetic, encouraging, and natural.
Avoid being cheesy or overly dramatic.

Maximum 3 emojis.
`
};