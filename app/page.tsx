"use client";
import { useState } from "react";
import ToolShell from "../components/ToolShell";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", limit: 2200, color: "#e1306c" },
  { key: "facebook",  label: "Facebook",  limit: 400,  color: "#1877f2" },
  { key: "linkedin",  label: "LinkedIn",  limit: 700,  color: "#0a66c2" },
  { key: "tiktok",    label: "TikTok",    limit: 300,  color: "#010101" },
];

const TONE_LABELS: Record<string, string> = {
  PROFESSIONAL: "Professional",
  RELATABLE:    "Relatable",
  QUESTION:     "Drive comments",
};

function parsePosts(raw: string): { tone: string; text: string }[] {
  const posts: { tone: string; text: string }[] = [];
  const tones = ["PROFESSIONAL", "RELATABLE", "QUESTION"];
  for (const tone of tones) {
    const regex = new RegExp(`\\[${tone}\\]\\s*([\\s\\S]*?)(?=\\[(?:PROFESSIONAL|RELATABLE|QUESTION)\\]|$)`, "i");
    const match = raw.match(regex);
    if (match) posts.push({ tone, text: match[1].trim() });
  }
  if (posts.length === 0) {
    const parts = raw.split(/\n\n+/).filter(p => p.trim());
    parts.slice(0, 3).forEach((p, i) => posts.push({ tone: tones[i] || "POST", text: p.trim() }));
  }
  return posts;
}

function PostCard({
  post,
  charLimit,
  platformColor,
}: {
  post: { tone: string; text: string };
  charLimit: number;
  platformColor: string;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const over = post.text.length > charLimit;
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
          <span style={{ fontSize: "0.72rem", color: over ? "#f87171" : "var(--faint)" }}>
            {post.text.length}/{charLimit}
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
  const [posts, setPosts] = useState<{ tone: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyAll, setCopyAll] = useState(false);

  const platformObj = PLATFORMS.find(p => p.key === platform) ?? PLATFORMS[0];

  const generate = async () => {
    if (!update.trim()) return;
    setLoading(true);
    setError("");
    setPosts([]);
    try {
      const res = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, businessType, update }),
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

  return (
    <ToolShell
      title="Social Post Generator"
      tag="Content automation"
      description="Tell it what you did today. Get 3 ready-to-post captions formatted for the platform you choose — professional, relatable, and one designed to drive comments."
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
                  onClick={() => setPlatform(p.key)}
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

          {/* Business type */}
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
              Business type <span style={{ color: "var(--faint)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              placeholder="e.g. estate agent, cleaning company, plumber, café"
              value={businessType}
              onChange={e => setBusinessType(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* What happened */}
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
              What do you want to post about?
            </label>
            <textarea
              rows={3}
              placeholder="e.g. just completed a 3-bed end-of-tenancy clean in Colchester — took 4 hours, client was really happy, place looks brand new"
              value={update}
              onChange={e => setUpdate(e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <button
            onClick={generate}
            disabled={loading || !update.trim()}
            style={{
              padding: "12px",
              background: update.trim() && !loading ? platformObj.color : "var(--surface-2)",
              color: update.trim() && !loading ? "#fff" : "var(--faint)",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: update.trim() && !loading ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Generating…" : `Generate ${platformObj.label} captions →`}
          </button>

          {error && <p style={{ fontSize: "0.85rem", color: "#f87171", margin: 0 }}>{error}</p>}
        </div>

        {/* Results */}
        {posts.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>
                3 captions · {platformObj.label} · {platformObj.limit.toLocaleString()} char limit
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
                />
              ))}
            </div>

            <div style={{ padding: "20px", background: `${platformObj.color}10`, border: `1px solid ${platformObj.color}30`, borderRadius: "10px" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: platformObj.color }}>Want a weekly pipeline?</strong> — I can build a version that generates a full week of posts from one Monday morning form, auto-formatted for each platform. <a href="/#contact" style={{ color: platformObj.color }}>Get in touch →</a>
              </p>
            </div>
          </>
        )}

      </div>
    </ToolShell>
  );
}
