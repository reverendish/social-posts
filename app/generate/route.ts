import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { platform, businessType, update } = await req.json();

  const limits: Record<string, string> = {
    instagram: "Instagram (max 2,200 chars, 3–5 hashtags at the end)",
    facebook:  "Facebook (max 400 chars, 1–2 hashtags, conversational tone)",
    linkedin:  "LinkedIn (max 700 chars, professional tone, no more than 3 hashtags)",
    tiktok:    "TikTok (max 300 chars, punchy, trend-aware, 3–5 hashtags)",
    general:   "general social media (150 words max each, 3–5 hashtags)",
  };
  const platformDesc = limits[platform] || limits.general;

  const prompt = `Write 3 social media captions for a ${businessType || "small"} business, formatted for ${platformDesc}.

Today's update: "${update}"

Output exactly this format — no extra commentary:

[PROFESSIONAL]
[caption]

[RELATABLE]
[caption]

[QUESTION]
[caption that ends with a question to drive comments]

Each caption should sound like a real person wrote it. No corporate language. No "We are pleased to announce".`;

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const result = data.choices?.[0]?.message?.content ?? "Something went wrong.";
  return NextResponse.json({ result });
}
