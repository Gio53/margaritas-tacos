// ============================================================
// Sample Clover-style receipt text (same rules as server)
// Open: /receipt-preview
// ============================================================

import { Link } from "wouter";
import {
  buildCloverLineNameAndNote,
  type CloverReceiptLineInput,
} from "@shared/cloverReceiptLayout";

const SAMPLES: CloverReceiptLineInput[] = [
  {
    categoryId: "3-american-tacos",
    categoryName: "3 American Tacos",
    itemName: "Ground Beef",
    quantity: 1,
    choices: { shell: "Hard shell" },
    removeIngredients: ["Sour Cream"],
    addExtras: [{ name: "Guacamole", quantity: 1 }],
  },
  {
    categoryId: "mexican-street-tacos",
    categoryName: "3 Mexican Street Tacos",
    itemName: "Steak (Top Sirloin)",
    quantity: 2,
    removeIngredients: [],
    addExtras: [],
  },
  {
    categoryName: "Burrito",
    itemName: "Grilled Chicken",
    quantity: 1,
    removeIngredients: ["Lettuce"],
    addExtras: [
      { name: "Sour Cream", quantity: 1 },
      { name: "Pico de Gallo", quantity: 1 },
    ],
  },
];

function TicketBlock({ line }: { line: CloverReceiptLineInput }) {
  const { name, lineNote } = buildCloverLineNameAndNote(line);
  return (
    <div
      className="rounded-lg border-2 p-4 text-left font-mono text-sm leading-relaxed"
      style={{ borderColor: "#2C1810", backgroundColor: "#fafafa", maxWidth: "22rem" }}
    >
      <div className="whitespace-pre-wrap text-black">{name}</div>
      {lineNote && (
        <>
          <div className="my-2 border-t border-dashed border-gray-400" />
          <div className="whitespace-pre-wrap text-gray-800">{lineNote}</div>
        </>
      )}
    </div>
  );
}

export default function ReceiptLayoutPreview() {
  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "#FFF8F0", fontFamily: "'Lato', sans-serif" }}
    >
      <div className="max-w-3xl mx-auto">
        <p className="mb-2">
          <Link href="/" className="text-[#C4622D] font-semibold underline">
            ← Home
          </Link>
        </p>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "#2C1810", fontFamily: "'Oswald', sans-serif" }}
        >
          Clover receipt layout (sample)
        </h1>
        <p className="text-sm mb-6" style={{ color: "#5c4033" }}>
          This matches how the server builds each line item&apos;s{" "}
          <strong>name</strong> (quantity + item) and <strong>note</strong> (shell if
          any, then <strong>No:</strong>, then <strong>Add:</strong>). Your Clover
          station may still show its own quantity column on the left.
        </p>
        <div className="space-y-8">
          {SAMPLES.map((line, i) => (
            <div key={i}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#8B5A2B" }}>
                Example {i + 1}
              </p>
              <TicketBlock line={line} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
