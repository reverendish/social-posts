import { NextRequest, NextResponse } from "next/server";

function buildGbpPrompt(
  businessType: string,
  gbpPostType: string,
  update: string,
  eventName: string,
  eventStart: string,
  eventEnd: string,
  offerTitle: string,
  couponCode: string
): string {
  const biz = businessType || "local business";
  const dateStr = (d: string) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

  if (gbpPostType === "event") {
    const dates = eventStart
      ? `${dateStr(eventStart)}${eventEnd ? ` – ${dateStr(eventEnd)}` : ""}`
      : "";
    return `Write 3 Google Business Profile EVENT posts for a ${biz}.

Event: "${eventName}"
${dates ? `Dates: ${dates}` : ""}
Details: "${update}"

Rules:
- Google Business Profile posts have a 1,500 char max. But posts under 300 chars get the best engagement on mobile — write with that in mind.
- No corporate language. Sound like a real local business.
- Include a clear call to action (call, book, visit, etc.)
- Do NOT use asterisks or markdown formatting — plain text only.
- Target audience: local homeowners, landlords, or people needing a trade service in the area.

Output exactly this format — no extra commentary:

[PUNCHY]
[under 150 chars — ultra-short punchy version]

[INFORMATIVE]
[150–300 chars — includes key details and CTA]

[ENGAGING]
[300–500 chars — full detail with context, story element, and CTA]`;
  }

  if (gbpPostType === "offer") {
    const expiry = eventEnd ? `Valid until: ${dateStr(eventEnd)}` : "";
    return `Write 3 Google Business Profile OFFER posts for a ${biz}.

Offer: "${offerTitle}"
${couponCode ? `Coupon code: ${couponCode}` : ""}
${expiry}
Details: "${update}"

Rules:
- Google Business Profile posts have a 1,500 char max. But posts under 300 chars get the best engagement on mobile — write with that in mind.
- Make the offer feel urgent and local — not generic ad copy.
- No corporate language. Sound like a real local business owner.
- Include a clear call to action.
- Do NOT use asterisks or markdown formatting — plain text only.
- Target audience: local homeowners, landlords, or people needing a trade service.

Output exactly this format — no extra commentary:

[PUNCHY]
[under 150 chars — the offer headline + CTA, ultra-short]

[INFORMATIVE]
[150–300 chars — what's included, how to claim, deadline if set]

[ENGAGING]
[300–500 chars — full detail with a reason WHY they're running the offer, what's included, and CTA]`;
  }

  // What's New (default)
  return `Write 3 Google Business Profile "What's New" posts for a ${biz}.

Update: "${update}"

Rules:
- Google Business Profile posts have a 1,500 char max. But posts under 300 chars get the best engagement on mobile — write with that in mind.
- Sound like the business owner wrote it — real, local, specific.
- No corporate language. No "We are pleased to announce". No asterisks or markdown.
- Each post should include a subtle call to action (call us, get a quote, visit us, etc.)
- You're writing for estate agents, tradespeople, and local service businesses in the UK.

Output exactly this format — no extra commentary:

[PUNCHY]
[under 150 chars — one punchy sentence + CTA]

[INFORMATIVE]
[150–300 chars — what happened, why it matters, CTA]

[ENGAGING]
[300–500 chars — fuller version with a bit of story, specific detail, and CTA]`;
}

export async function POST(req: NextRequest) {
  const {
    platform,
    businessType,
    update,
    gbpPostType = "whats_new",
    eventName = "",
    eventStart = "",
    eventEnd = "",
    offerTitle = "",
    couponCode = "",
  } = await req.json();

  let prompt: string;

  if (platform === "gbp") {
    prompt = buildGbpPrompt(
      businessType,
      gbpPostType,
      update,
      eventName,
      eventStart,
      eventEnd,
      offerTitle,
      couponCode
    );
  } else {
    const limits: Record<string, string> = {
      instagram: "Instagram (max 2,200 chars, 3–5 hashtags at the end)",
      facebook:  "Facebook (max 400 chars, 1–2 hashtags, conversational tone)",
      linkedin:  "LinkedIn (max 700 chars, professional tone, no more than 3 hashtags)",
      tiktok:    "TikTok (max 300 chars, punchy, trend-aware, 3–5 hashtags)",
      general:   "general social media (150 words max each, 3–5 hashtags)",
    };
    const platformDesc = limits[platform] || limits.general;

    prompt = `Write 3 social media captions for a ${businessType || "small"} business, formatted for ${platformDesc}.

Today's update: "${update}"

Output exactly this format — no extra commentary:

[PROFESSIONAL]
[caption]

[RELATABLE]
[caption]

[QUESTION]
[caption that ends with a question to drive comments]

Each caption should sound like a real person wrote it. No corporate language. No "We are pleased to announce".`;
  }

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const result = data.choices?.[0]?.message?.content ?? "Something went wrong.";
  return NextResponse.json({ result });
}
