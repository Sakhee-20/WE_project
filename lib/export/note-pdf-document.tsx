import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { JSONContent } from "@tiptap/core";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.45,
  },
  title: {
    fontSize: 20,
    marginBottom: 14,
    fontWeight: "bold",
  },
  h1: { fontSize: 16, marginTop: 10, marginBottom: 6, fontWeight: "bold" },
  h2: { fontSize: 13, marginTop: 8, marginBottom: 5, fontWeight: "bold" },
  h3: { fontSize: 11, marginTop: 6, marginBottom: 4, fontWeight: "bold" },
  paragraph: { marginBottom: 5 },
  listRow: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  listMark: { width: 18, fontSize: 10 },
  blockquote: {
    marginLeft: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#a1a1aa",
    marginBottom: 6,
  },
  codeBlock: {
    backgroundColor: "#f4f4f5",
    padding: 8,
    marginBottom: 6,
    borderRadius: 2,
  },
  codeBlockText: { fontFamily: "Courier", fontSize: 8 },
  inlineCode: {
    fontFamily: "Courier",
    fontSize: 9,
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 2,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
    marginVertical: 8,
  },
  figure: { marginBottom: 8, alignItems: "center" },
  figureImg: { maxWidth: "100%", maxHeight: 220, objectFit: "contain" },
  caption: { fontSize: 8, color: "#71717a", marginTop: 4, textAlign: "center" },
  missingImg: { fontSize: 9, color: "#a1a1aa", fontStyle: "italic" },
});

function wrapTextMarks(
  node: JSONContent & { type: "text" }
): React.ReactNode {
  let inner: React.ReactNode = node.text ?? "";
  const marks = node.marks ?? [];
  for (let j = marks.length - 1; j >= 0; j--) {
    const m = marks[j]!;
    if (m.type === "bold") {
      inner = <Text style={{ fontWeight: "bold" }}>{inner}</Text>;
    } else if (m.type === "italic") {
      inner = <Text style={{ fontStyle: "italic" }}>{inner}</Text>;
    } else if (m.type === "code") {
      inner = <Text style={styles.inlineCode}>{inner}</Text>;
    } else if (m.type === "strike") {
      inner = <Text style={{ textDecoration: "line-through" }}>{inner}</Text>;
    } else if (m.type === "link") {
      const href = String((m.attrs as { href?: string })?.href ?? "");
      inner = (
        <Link src={href} style={{ color: "#2563eb", textDecoration: "none" }}>
          {inner}
        </Link>
      );
    }
  }
  return inner;
}

function renderInline(content: JSONContent[] | undefined): React.ReactNode[] {
  if (!content?.length) return [" "];
  return content.map((c, i) => {
    if (c.type === "text") {
      return (
        <React.Fragment key={i}>
          {wrapTextMarks(c as JSONContent & { type: "text" })}
        </React.Fragment>
      );
    }
    if (c.type === "hardBreak") {
      return "\n";
    }
    return " ";
  });
}

function extractPlainText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  if (!node.content?.length) return "";
  return node.content.map(extractPlainText).join("");
}

function renderListItem(
  li: JSONContent,
  keyPrefix: string,
  kind: "bullet" | "ordered",
  index1: number
): React.ReactNode[] {
  if (li.type !== "listItem") return [];
  const mark = kind === "bullet" ? "• " : `${index1}. `;
  return [
    <View key={keyPrefix} style={styles.listRow} wrap>
      <Text style={styles.listMark}>{mark}</Text>
      <View style={{ flex: 1 }}>
        {(li.content ?? []).flatMap((child, i) =>
          renderBlock(child, `${keyPrefix}-c${i}`)
        )}
      </View>
    </View>,
  ];
}

function renderBlock(node: JSONContent, keyPrefix: string): React.ReactNode[] {
  switch (node.type) {
    case "doc":
      return (node.content ?? []).flatMap((c, i) =>
        renderBlock(c, `${keyPrefix}-${i}`)
      );
    case "paragraph":
      return [
        <Text key={keyPrefix} style={styles.paragraph} wrap>
          {renderInline(node.content)}
        </Text>,
      ];
    case "heading": {
      const level = (node.attrs as { level?: number })?.level ?? 1;
      const hStyle =
        level <= 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
      return [
        <Text key={keyPrefix} style={hStyle} wrap>
          {renderInline(node.content)}
        </Text>,
      ];
    }
    case "bulletList":
      return (node.content ?? []).flatMap((li, i) =>
        renderListItem(li, `${keyPrefix}-li${i}`, "bullet", i + 1)
      );
    case "orderedList":
      return (node.content ?? []).flatMap((li, i) =>
        renderListItem(li, `${keyPrefix}-li${i}`, "ordered", i + 1)
      );
    case "blockquote":
      return [
        <View key={keyPrefix} style={styles.blockquote} wrap>
          {(node.content ?? []).flatMap((c, i) =>
            renderBlock(c, `${keyPrefix}-q${i}`)
          )}
        </View>,
      ];
    case "codeBlock":
      return [
        <View key={keyPrefix} style={styles.codeBlock} wrap={false}>
          <Text style={styles.codeBlockText}>{extractPlainText(node)}</Text>
        </View>,
      ];
    case "horizontalRule":
      return [<View key={keyPrefix} style={styles.hr} />];
    case "image": {
      const src = String((node.attrs as { src?: string })?.src ?? "");
      const caption = String(
        (node.attrs as { caption?: string })?.caption ?? ""
      ).trim();
      return [
        <View key={keyPrefix} style={styles.figure} wrap={false}>
          {src ? (
            <Image src={src} style={styles.figureImg} />
          ) : (
            <Text style={styles.missingImg}>[Image]</Text>
          )}
          {caption ? (
            <Text style={styles.caption} wrap>
              {caption}
            </Text>
          ) : null}
        </View>,
      ];
    }
    default:
      return [];
  }
}

export function NotePdfDocument({
  title,
  doc,
}: {
  title: string;
  doc: JSONContent;
}) {
  const blocks =
    doc.type === "doc"
      ? (doc.content ?? []).flatMap((c, i) => renderBlock(c, `b${i}`))
      : renderBlock(doc, "root");

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>{title}</Text>
        {blocks}
      </Page>
    </Document>
  );
}

export async function renderNotePdfBuffer(
  title: string,
  doc: JSONContent
): Promise<Buffer> {
  const el = <NotePdfDocument title={title} doc={doc} />;
  return renderToBuffer(el);
}
