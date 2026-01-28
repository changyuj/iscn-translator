/**
 * ISCN Translator Logic
 * Handles parsing and translating Karyotype strings.
 */

const ISCN_MAP = {
  // Structural
  t: "Translocation",
  del: "Deletion",
  inv: "Inversion",
  der: "Derivative chromosome",
  add: "Additional material of unknown origin",
  ins: "Insertion",
  i: "Isochromosome",
  dup: "Duplication",
  r: "Ring chromosome",
  mar: "Marker chromosome",
  dic: "Dicentric chromosome",
  idic: "Isodicentric chromosome",

  // Origin/Misc
  mat: "Maternal origin",
  pat: "Paternal origin",
  cp: "Composite karyotype",
  ish: "In situ hybridization",
  cgh: "Comparative genomic hybridization",
  arr: "Microarray",

  // Positions
  p: "short arm (p)",
  q: "long arm (q)",
  cen: "centromere",
  ter: "terminus",
};

/**
 * Translates a full karyotype string.
 * @param {string} input - e.g., "46,XX,t(9;22)(q34;q11)"
 * @returns {string} - Plain English translation
 */
function translateKaryotype(input) {
  if (!input || input.trim() === "") return "Please enter a karyotype string.";

  // Normalize input (remove spaces)
  const normalized = input.replace(/\s+/g, "");

  // Split by commas to handle multiple abnormalities
  const parts = normalized.split(",");

  if (parts.length < 2)
    return "Invalid ISCN format. Expected at least 'Count,Sex'.";

  const count = parts[0];
  const sex = parts[1];
  let description = `A karyotype with ${count} chromosomes and ${sex} sex chromosomes.`;

  const abnormalities = parts.slice(2);
  if (abnormalities.length === 0) {
    description += " No structural or numerical abnormalities detected.";
  } else {
    description += " The following abnormalities were found:";
    const translatedAbnormalities = abnormalities.map((part) =>
      translateAbnormality(part),
    );
    description +=
      "<ul>" +
      translatedAbnormalities.map((a) => `<li>${a}</li>`).join("") +
      "</ul>";
  }

  return description;
}

/**
 * Translates a single abnormality part.
 * @param {string} part - e.g., "t(9;22)(q34;q11)" or "+21"
 * @returns {string}
 */
function translateAbnormality(part) {
  // Numerical (e.g., +21, -X)
  if (part.startsWith("+")) {
    return `Gain of chromosome ${part.substring(1)}.`;
  }
  if (part.startsWith("-")) {
    return `Loss of chromosome ${part.substring(1)}.`;
  }

  // Translocation: t(9;22)(q34;q11)
  const tMatch = part.match(
    /^t\((\d+|[XY]);(\d+|[XY])\)\((p|q\d+\.?\d*);(p|q\d+\.?\d*)\)$/,
  );
  if (tMatch) {
    const [_, chr1, chr2, band1, band2] = tMatch;
    let suffix = "";
    if (chr1 === "9" && chr2 === "22")
      suffix =
        " (often associated with Chronic Myeloid Leukemia / Philadelphia chromosome)";
    return `Translocation between chromosome ${chr1} at band ${band1} and chromosome ${chr2} at band ${band2}${suffix}.`;
  }

  // Deletion: del(5)(p15)
  const delMatch = part.match(/^del\((\d+|[XY])\)\((p|q\d+\.?\d*)\)$/);
  if (delMatch) {
    const [_, chr, band] = delMatch;
    return `Deletion on chromosome ${chr} at band ${band}.`;
  }

  // Inversion: inv(16)(p13q22)
  const invMatch = part.match(/^inv\((\d+|[XY])\)\((p\d+q\d+)\)$/);
  if (invMatch) {
    const [_, chr, bands] = invMatch;
    return `Inversion on chromosome ${chr} involving ${bands}.`;
  }

  // Derivative: der(1)
  if (part.startsWith("der")) {
    const chrMatch = part.match(/der\((\d+|[XY])\)/);
    return `Derivative chromosome formed from chromosome ${chrMatch ? chrMatch[1] : "unknown"}.`;
  }

  // Generic mapping lookup
  for (const key in ISCN_MAP) {
    if (part.startsWith(key)) {
      return `${ISCN_MAP[key]} involving ${part.substring(key.length)}.`;
    }
  }

  return `Unrecognized nomenclature: ${part}`;
}

// Export for UI
if (typeof module !== "undefined" && module.exports) {
  module.exports = { translateKaryotype };
}
