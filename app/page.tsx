"use client";
import { useState } from "react";
import ToolShell from "../components/ToolShell";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", limit: 2200, color: "#e1306c" },
  { key: "facebook",  label: "Facebook",  limit: 400,  color: "#1877f2" },
  { key: "linkedin",  label: "LinkedIn",  limit: 700,  color: "#0a66c2" },
  { key: "tiktok",    label: "TikTok",    limit: 300,  color: "#010101" },
  { key: "gbp",       label: "Google Business", limit: 1500, color: "#4285f4" },
];

const GBP_POST_TYPES = [
  { key: "whats_new", label: "What's New" },
  { key: "event",     label: "Event" },
  { key: "offer",     label: "Offer" },
];

const TONE_LABELS: Record<string, string> = {
  PROFESSIONAL: "Professional",
  RELATABLE:    "Relatable",
  QUESTION:     "Drive comments",
  PUNCHY:       "Punchy (under 150)",
  INFORMATIVE:  "Informative (~300)",
  ENGAGING:     "Engaging (~500)",
};

function parsePosts(raw: string): { tone: string; text: string }[] {
  const posts: { tone: string; text: string }[] = [];
  const allTags = ["PROFESSIONAL", "RELATABLE", "QUESTION", "PUNCHY", "INFORMATIVE", "ENGAGING"];
  for (const tone of allTags) {
    const regex = new RegExp(
      `\\[${tone}\\]\\s*([\\s\\S]*?)(?=\\[(?:PROFESSIONAL|RELATABLE|QUESTION|PUNCHY|INFORMATIVE|ENGAGING)\\]|$)`,
      "i"
    );
    const match = raw.match(regex);
    if (match) posts.push({ tone, text: match[1].trim() });
  }
  if (posts.length === 0) {
    const parts = raw.split(/\n\n+/).filter(p => p.trim());
    parts.slice(0, 3).forEach((p, i) => posts.push({ tone: allTags[i] || "POST", text: p.trim() }));
  }
  return posts;
}

function PostCard({
  post,
  charLimit,
  platformColor,
  idealLimit,
}: {
  post: { tone: string; text: string };
  charLimit: number;
  platformColor: string;
  idealLimit?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const over = post.text.length > charLimit;
  const overIdeal = idealLimit && post.text.length > idealLimit;
  const preview = post.text.length > 280 && !expanded ? post.text.slice(0, 280) + "…" : post.text;

  const copy = () => {
    navigator.clipboard.writeText(post.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        display: "grid",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: platformColor,
            textTransform: "uppercase",
          }}
        >
          {TONE_LABELS[post.tone] || post.tone}
        </span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span
            style={{
              fontSize: "0.72rem",
              color: over ? "#f87171" : overIdeal ? "#fb923c" : "var(--faint)",
            }}
          >
            {post.text.length}{idealLimit ? `/${idealLimit}★` : `/${charLimit}`}
          </span>
          <button
            onClick={copy}
            style={{
              fontSize: "0.78rem",
              padding: "4px 12px",
              background: "transparent",
              border: `1px solid ${copied ? platformColor : "var(--border-2)"}`,
              borderRadius: "6px",
              color: copied ? platformColor : "var(--muted)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <p style={{ fontSize: "0.875rem", lineHeight: 1.75, color: "var(--text)", margin: 0, whiteSpace: "pre-wrap" }}>
        {preview}
      </p>

      {post.text.length > 280 && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ fontSize: "0.78rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
        >
          {expanded ? "Show less ↑" : "Show more ↓"}
        </button>
      )}
    </div>
  );
}

export default function SocialPosts() {
  const [businessType, setBusinessType] = useState("");
  const [update, setUpdate] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [gbpPostType, setGbpPostType] = useState("whats_new");
  const [eventName, setEventName] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [posts, setPosts] = useState<{ tone: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyAll, setCopyAll] = useState(false);

  const platformObj = PLATFORMS.find(p => p.key === platform) ?? PLATFORMS[0];
  const isGbp = platform === "gbp";

  const canGenerate = () => {
    if (!update.trim()) return false;
    if (isGbp && gbpPostType === "event" && !eventName.trim()) return false;
    if (isGbp && gbpPostType === "offer" && !offerTitle.trim()) return false;
    return true;
  };

  const generate = async () => {
    if (!canGenerate()) return;
    setLoading(true);
    setError("");
    setPosts([]);
    try {
      const res = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          businessType,
          update,
          gbpPostType,
          eventName,
          eventStart,
          eventEnd,
          offerTitle,
          couponCode,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPosts(parsePosts(data.result));
    } catch (e) {
      setError("Generation failed. Try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    const text = posts.map(p => `— ${TONE_LABELS[p.tone] || p.tone} —\n${p.text}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopyAll(true);
    setTimeout(() => setCopyAll(false), 1500);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "var(--surface)",
    border: "1px solid var(--border-2)",
    borderRadius: "8px",
    color: "var(--text)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const halfInputStyle: React.CSSProperties = {
    ...inputStyle,
    width: "calc(50% - 6px)",
  };

  return (
    <ToolShell
      title="Social Post Generator"
      tag="Content automation"
      description="Tell it what you did today. Get 3 ready-to-post captions — professional, relatable, and one designed to drive engagement. Now with Google Business Profile posts."
    >
      <div style={{ display: "grid", gap: "20px" }}>

        <div style={{ padding: "24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", display: "grid", gap: "16px" }}>

          {/* Platform selector */}
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "10px" }}>
              Platform
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.key}
                  onClick={() => { setPlatform(p.key); setPosts([]); }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: platform === p.key ? `2px solid ${p.color}` : "1px solid var(--border-2)",
                    background: platform === p.key ? `${p.color}18` : "var(--surface-2)",
                    color: platform === p.key ? p.color : "var(--muted)",
                    fontSize: "0.85rem",
                    fontWeight: platform === p.key ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* GBP post type selector */}
          {isGbp && (
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "10px" }}>
                Post type
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {GBP_POST_TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setGbpPostType(t.key); setPosts([]); }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: gbpPostType === t.key ? `2px solid #4285f4` : "1px solid var(--border-2)",
                      background: gbpPostType === t.key ? `#4285f418` : "var(--surface-2)",
                      color: gbpPostType === t.key ? "#4285f4" : "var(--muted)",
                      fontSize: "0.85rem",
                      fontWeight: gbpPostType === t.key ? 700 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Business type */}
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
              Business type <span style={{ color: "var(--faint)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              placeholder="e.g. estate agent, plumber, electrician, cleaning company"
              value={businessType}
              onChange={e => setBusinessType(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Event fields */}
          {isGbp && gbpPostType === "event" && (
            <>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                  Event name <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  placeholder="e.g. Free Home Valuation Day, Open Day, Summer Clearance Event"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                    Start date <span style={{ color: "var(--faint)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={eventStart}
                    onChange={e => setEventStart(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                    End date <span style={{ color: "var(--faint)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={eventEnd}
                    onChange={e => setEventEnd(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </>
          )}

          {/* Offer fields */}
          {isGbp && gbpPostType === "offer" && (
            <>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                  Offer title <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  placeholder="e.g. 10% off end-of-tenancy cleans, Free boiler check, No sale no fee"
                  value={offerTitle}
                  onChange={e => setOfferTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                    Coupon code <span style={{ color: "var(--faint)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    placeholder="e.g. SUMMER10"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                    Valid until <span style={{ color: "var(--faint)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={eventEnd}
                    onChange={e => setEventEnd(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </>
          )}

          {/* Main input */}
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
              {isGbp && gbpPostType === "event"
                ? "Describe the event"
                : isGbp && gbpPostType === "offer"
                ? "Describe the offer / what's included"
                : "What do you want to post about?"}
            </label>
            <textarea
              rows={3}
              placeholder={
                isGbp && gbpPostType === "event"
                  ? "e.g. hosting a free property valuation day at our Colchester branch, no obligation, appointments or walk-ins welcome"
                  : isGbp && gbpPostType === "offer"
                  ? "e.g. 10% off all end-of-tenancy cleans booked in July, includes full kitchen, bathrooms and carpets"
                  : isGbp
                  ? "e.g. just completed a full bathroom refit in Colchester — client wanted a modern wet room, turned out fantastic"
                  : "e.g. just completed a 3-bed end-of-tenancy clean in Colchester — took 4 hours, client was really happy, place looks brand new"
              }
              value={update}
              onChange={e => setUpdate(e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <button
            onClick={generate}
            disabled={loading || !canGenerate()}
            style={{
              padding: "12px",
              background: canGenerate() && !loading ? platformObj.color : "var(--surface-2)",
              color: canGenerate() && !loading ? "#fff" : "var(--faint)",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: canGenerate() && !loading ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            {loading
              ? "Generating…"
              : isGbp
              ? `Generate GBP ${GBP_POST_TYPES.find(t => t.key === gbpPostType)?.label} post →`
              : `Generate ${platformObj.label} captions →`}
          </button>

          {error && <p style={{ fontSize: "0.85rem", color: "#f87171", margin: 0 }}>{error}</p>}
        </div>

        {/* Results */}
        {posts.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>
                {isGbp
                  ? `3 variations · Google Business Profile · ★ ideal under 300 chars`
                  : `3 captions · ${platformObj.label} · ${platformObj.limit.toLocaleString()} char limit`}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={generate}
                  style={{ fontSize: "0.78rem", padding: "5px 12px", background: "transparent", border: "1px solid var(--border-2)", borderRadius: "6px", color: "var(--muted)", cursor: "pointer" }}
                >
                  Regenerate
                </button>
                <button
                  onClick={handleCopyAll}
                  style={{ fontSize: "0.78rem", padding: "5px 12px", background: "transparent", border: "1px solid var(--border-2)", borderRadius: "6px", color: copyAll ? platformObj.color : "var(--muted)", cursor: "pointer" }}
                >
                  {copyAll ? "Copied!" : "Copy all"}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {posts.map((post, i) => (
                <PostCard
                  key={i}
                  post={post}
                  charLimit={platformObj.limit}
                  platformColor={platformObj.color}
                  idealLimit={isGbp ? 300 : undefined}
                />
              ))}
            </div>

            {isGbp && (
              <div style={{ padding: "16px 20px", background: "#4285f410", border: "1px solid #4285f430", borderRadius: "10px" }}>
                <p style={{ fontSize: "0.83rem", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                  <strong style={{ color: "#4285f4" }}>GBP tip:</strong> Posts under 300 chars get better engagement on mobile. ★ marks the ideal limit. Posts expire after 7 days (What's New) — schedule weekly.
                </p>
              </div>
            )}

            {!isGbp && (
              <div style={{ padding: "20px", background: `${platformObj.color}10`, border: `1px solid ${platformObj.color}30`, borderRadius: "10px" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                  <strong style={{ color: platformObj.color }}>Want a weekly pipeline?</strong> — I can build a version that generates a full week of posts from one Monday morning form, auto-formatted for each platform. <a href="/#contact" style={{ color: platformObj.color }}>Get in touch →</a>
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </ToolShell>
  );
}
