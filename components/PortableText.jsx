"use client";

const C = {
  orange: "#FF6B00",
  pink: "#FF2D78",
  blue: "#00D4FF",
  white: "#FFFFFF",
  dim: "rgba(255,255,255,.48)",
  dimmer: "rgba(255,255,255,.22)",
};

const blockStyles = {
  normal: ({ children }) => (
    <p
      style={{
        fontFamily: "'DM Sans',sans-serif",
        fontSize: "clamp(15px,1.4vw,18px)",
        color: "rgba(255,255,255,0.74)",
        lineHeight: 1.9,
        marginBottom: "8px",
      }}
    >
      {children}
    </p>
  ),
  h2: ({ children, catColor }) => (
    <h2
      style={{
        fontFamily: "'Bebas Neue',sans-serif",
        fontSize: "clamp(26px,3vw,40px)",
        color: catColor,
        letterSpacing: ".3px",
        margin: "44px 0 12px",
        lineHeight: 1,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children, catColor }) => (
    <h3
      style={{
        fontFamily: "'Bebas Neue',sans-serif",
        fontSize: "clamp(20px,2.2vw,30px)",
        color: catColor,
        letterSpacing: ".3px",
        margin: "32px 0 8px",
        lineHeight: 1,
      }}
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4
      style={{
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 700,
        fontSize: "clamp(15px,1.4vw,18px)",
        color: C.white,
        margin: "24px 0 6px",
      }}
    >
      {children}
    </h4>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        borderLeft: `3px solid ${C.orange}`,
        paddingLeft: "20px",
        margin: "28px 0",
        fontFamily: "'DM Sans',sans-serif",
        fontStyle: "italic",
        fontSize: "clamp(16px,1.6vw,20px)",
        color: C.dim,
        lineHeight: 1.75,
      }}
    >
      {children}
    </blockquote>
  ),
};

const listStyles = {
  bullet: ({ children }) => (
    <ul style={{ margin: "16px 0", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {children}
    </ul>
  ),
  number: ({ children }) => (
    <ol style={{ margin: "16px 0", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {children}
    </ol>
  ),
};

const listItemStyle = {
  fontFamily: "'DM Sans',sans-serif",
  fontSize: "clamp(15px,1.4vw,17px)",
  color: "rgba(255,255,255,0.72)",
  lineHeight: 1.75,
};

const codeStyle = {
  fontFamily: "monospace",
  fontSize: "0.88em",
  background: "rgba(255,107,0,0.1)",
  border: "1px solid rgba(255,107,0,0.2)",
  borderRadius: "3px",
  padding: "2px 6px",
  color: C.orange,
};

const marks = {
  strong: ({ children }) => <strong style={{ color: C.white, fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: "italic", color: C.dim }}>{children}</em>,
  code: ({ children }) => <code style={codeStyle}>{children}</code>,
  underline: ({ children }) => <span style={{ textDecoration: "underline", textDecorationColor: C.orange }}>{children}</span>,
  link: ({ value, children }) => (
    <a
      href={value?.href}
      target={value?.blank ? "_blank" : "_self"}
      rel={value?.blank ? "noopener noreferrer" : undefined}
      style={{
        color: C.orange,
        textDecoration: "underline",
        textDecorationColor: `${C.orange}60`,
        transition: "opacity .2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = ".7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      {children}
    </a>
  ),
};

const CALLOUT_COLORS = { info: C.blue, warning: C.orange, tip: "#00C48C", stat: C.pink };

function CalloutBlock({ value }) {
  const color = CALLOUT_COLORS[value?.type] || C.orange;
  return (
    <div
      style={{
        margin: "28px 0",
        padding: "20px 24px",
        background: `${color}0D`,
        border: `1px solid ${color}40`,
        borderLeft: `4px solid ${color}`,
        borderRadius: "0 4px 4px 0",
      }}
    >
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "3px", color, marginBottom: "6px" }}>
        {String(value?.type || "INFO").toUpperCase()}
      </div>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>
        {value?.text}
      </p>
    </div>
  );
}

function ImageBlock({ value }) {
  if (!value?.asset?.url) return null;
  return (
    <figure style={{ margin: "32px 0" }}>
      <img
        src={value.asset.url}
        alt={value.alt || ""}
        style={{ width: "100%", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)", display: "block" }}
      />
      {value.caption && (
        <figcaption style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer, marginTop: "10px", textAlign: "center" }}>
          {value.caption}
        </figcaption>
      )}
    </figure>
  );
}

function renderSpans(children, catColor, markDefs) {
  if (!Array.isArray(children)) return null;
  return children.map((span, i) => {
    if (span._type !== "span") return null;
    if (!span.marks || span.marks.length === 0) return <span key={span._key || i}>{span.text}</span>;

    return span.marks.reduce((acc, mark) => {
      if (mark === "strong") return <strong key={`${span._key || i}-strong`} style={{ color: C.white, fontWeight: 700 }}>{acc}</strong>;
      if (mark === "em") return <em key={`${span._key || i}-em`} style={{ fontStyle: "italic", color: C.dim }}>{acc}</em>;
      if (mark === "code") return <code key={`${span._key || i}-code`} style={codeStyle}>{acc}</code>;
      if (mark === "underline") return <span key={`${span._key || i}-underline`} style={{ textDecoration: "underline", textDecorationColor: C.orange }}>{acc}</span>;
      const def = markDefs?.find((d) => d._key === mark);
      if (def && def._type === "link") return marks.link({ value: def, children: acc });
      return acc;
    }, span.text);
  });
}

function groupListItems(blocks) {
  const result = [];
  let currentList = null;

  blocks.forEach((block) => {
    if (block._type === "block" && block.listItem) {
      if (!currentList || currentList.type !== block.listItem) {
        currentList = { type: block.listItem, items: [] };
        result.push(currentList);
      }
      currentList.items.push(block);
    } else {
      currentList = null;
      result.push(block);
    }
  });

  return result;
}

export function VibeCirclePortableText({ value = [], catColor = C.orange }) {
  if (!Array.isArray(value) || value.length === 0) return null;

  const grouped = groupListItems(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {grouped.map((block, i) => {
        if (block._type === "callout") return <CalloutBlock key={block._key || i} value={block} />;
        if (block._type === "image") return <ImageBlock key={block._key || i} value={block} />;

        if (block.items && block.type) {
          const ListTag = listStyles[block.type] || listStyles.bullet;
          return (
            <ListTag key={`list-${i}`}>
              {block.items.map((li) => (
                <li key={li._key} style={listItemStyle}>
                  {renderSpans(li.children, catColor, li.markDefs)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block._type === "block") {
          const Tag = blockStyles[block.style] || blockStyles.normal;
          const children = renderSpans(block.children, catColor, block.markDefs);
          return (
            <Tag key={block._key || i} catColor={catColor}>
              {children}
            </Tag>
          );
        }

        return null;
      })}
    </div>
  );
}




