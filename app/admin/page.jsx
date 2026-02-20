"use client";

import { useState } from "react";

export default function AdminPage() {
  const [postStatus, setPostStatus] = useState("");
  const [authorStatus, setAuthorStatus] = useState("");
  const [postBusy, setPostBusy] = useState(false);
  const [authorBusy, setAuthorBusy] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");

  async function submitPost(e) {
    e.preventDefault();
    setPostStatus("");
    setPostBusy(true);
    try {
      if (!adminSecret) throw new Error("Admin secret required.");
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "x-admin-secret": adminSecret },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create post.");
      setPostStatus(`Post created: ${json.id}`);
      e.currentTarget.reset();
    } catch (err) {
      setPostStatus(err.message);
    } finally {
      setPostBusy(false);
    }
  }

  async function submitAuthor(e) {
    e.preventDefault();
    setAuthorStatus("");
    setAuthorBusy(true);
    try {
      if (!adminSecret) throw new Error("Admin secret required.");
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/authors", {
        method: "POST",
        headers: { "x-admin-secret": adminSecret },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save author.");
      setAuthorStatus(json.updated ? `Author updated: ${json.id}` : `Author created: ${json.id}`);
      e.currentTarget.reset();
    } catch (err) {
      setAuthorStatus(err.message);
    } finally {
      setAuthorBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#05050A", color: "#FFFFFF", padding: "96px 20px" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "42px", letterSpacing: "2px", marginBottom: "12px" }}>
          Content Admin
        </h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", color: "rgba(255,255,255,0.6)", marginBottom: "32px" }}>
          Requires `SANITY_WRITE_TOKEN` or `SANITY_API_WRITE_TOKEN` on the server.
        </p>
        <div style={{ marginBottom: "24px" }}>
          <input
            name="adminSecret"
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            placeholder="Admin API Secret"
            style={inputStyle}
          />
        </div>

        <section style={{ padding: "24px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "24px", letterSpacing: "1px", marginBottom: "16px" }}>
            Create Post
          </h2>
          <form onSubmit={submitPost} style={{ display: "grid", gap: "14px" }}>
            <input name="title" placeholder="Title" required style={inputStyle} />
            <textarea name="subtitle" placeholder="Subtitle / Deck" required rows={2} style={inputStyle} />
            <textarea name="body" placeholder="Body (plain text, paragraphs separated by blank lines)" rows={8} style={inputStyle} />

            <div style={rowStyle}>
              <input name="authorName" placeholder="Author Name" required style={inputStyle} />
              <input name="authorRole" placeholder="Author Role (optional)" style={inputStyle} />
              <input name="authorAvatar" placeholder="Author Emoji (optional)" style={inputStyle} />
            </div>
            <textarea name="authorBio" placeholder="Author Bio (optional)" rows={2} style={inputStyle} />
            <input name="authorPhoto" type="file" accept="image/*" style={inputStyle} />

            <div style={rowStyle}>
              <input name="category" placeholder="Category" required style={inputStyle} />
              <input name="categoryColor" placeholder="Category Color (e.g. #FF6B00)" style={inputStyle} />
            </div>

            <div style={rowStyle}>
              <input name="emoji" placeholder="Cover Emoji (optional)" style={inputStyle} />
              <input name="thumbGradStart" placeholder="Thumb Gradient Start" style={inputStyle} />
              <input name="thumbGradEnd" placeholder="Thumb Gradient End" style={inputStyle} />
            </div>

            <div style={rowStyle}>
              <input name="tags" placeholder="Tags (comma-separated)" style={inputStyle} />
              <input name="publishedAt" placeholder="Published At (ISO, optional)" style={inputStyle} />
              <select name="featured" defaultValue="false" style={inputStyle}>
                <option value="false">Not Featured</option>
                <option value="true">Featured</option>
              </select>
            </div>

            <div style={rowStyle}>
              <input name="coverImage" type="file" accept="image/*" style={inputStyle} />
              <input name="bodyImages" type="file" accept="image/*" multiple style={inputStyle} />
            </div>

            <button disabled={postBusy} style={buttonStyle}>
              {postBusy ? "Creating..." : "Create Post"}
            </button>
            {postStatus && <div style={statusStyle}>{postStatus}</div>}
          </form>
        </section>

        <section style={{ padding: "24px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "24px", letterSpacing: "1px", marginBottom: "16px" }}>
            Create / Update Author
          </h2>
          <form onSubmit={submitAuthor} style={{ display: "grid", gap: "14px" }}>
            <div style={rowStyle}>
              <input name="name" placeholder="Author Name" required style={inputStyle} />
              <input name="role" placeholder="Role / Title" style={inputStyle} />
              <input name="avatarEmoji" placeholder="Avatar Emoji" style={inputStyle} />
            </div>
            <textarea name="bio" placeholder="Bio (optional)" rows={3} style={inputStyle} />
            <input name="photo" type="file" accept="image/*" style={inputStyle} />
            <button disabled={authorBusy} style={buttonStyle}>
              {authorBusy ? "Saving..." : "Save Author"}
            </button>
            {authorStatus && <div style={statusStyle}>{authorStatus}</div>}
          </form>
        </section>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "4px",
  padding: "10px 12px",
  fontFamily: "'DM Sans',sans-serif",
  fontSize: "14px",
  color: "#FFFFFF",
  outline: "none",
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "12px",
};

const buttonStyle = {
  background: "#FF6B00",
  color: "#05050A",
  border: "none",
  padding: "12px 16px",
  fontFamily: "'Bebas Neue',sans-serif",
  letterSpacing: "2px",
  fontSize: "14px",
  borderRadius: "4px",
  cursor: "pointer",
};

const statusStyle = {
  fontFamily: "'DM Sans',sans-serif",
  fontSize: "13px",
  color: "rgba(255,255,255,0.7)",
};
