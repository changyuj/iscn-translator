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

const CLINICAL_CONTEXT = {
  // Translocations
  "t(9;22)": "Chronic Myeloid Leukemia (CML), Philadelphia Chromosome",
  "t(15;17)": "Acute Promyelocytic Leukemia (APL / AML-M3)",
  "t(8;21)": "Acute Myeloid Leukemia (AML-M2)",
  "t(8;14)": "Burkitt Lymphoma",
  "t(14;18)": "Follicular Lymphoma",
  "t(11;14)": "Mantle Cell Lymphoma",
  "t(4;11)": "Acute Lymphoblastic Leukemia (ALL), often in infants",
  "t(11;19)": "AML / MDS with poor prognosis",
  
  // Inversions
  "inv(16)": "Acute Myeloid Leukemia (AML-M4eo)",
  "inv(3)": "AML / MDS with poor prognosis",
  
  // Deletions
  "del(5q)": "Myelodysplastic Syndrome (MDS) / 5q- syndrome",
  "del(7q)": "MDS / AML, associated with poor prognosis",
  "del(17p)": "Associated with TP53 loss and poor prognosis in many cancers (CLL, AML)",
  "del(20q)": "MDS and other myeloproliferative disorders",
  "del(13q)": "Chronic Lymphocytic Leukemia (CLL) or Retinoblastoma",
  "del(11q)": "AML / MDS with poor prognosis",
  
  // Numerical
  "+8": "Common in AML and MDS",
  "+12": "Chronic Lymphocytic Leukemia (CLL)",
  "+21": "Associated with Down Syndrome (germline) or AML/MDS (acquired)",
  "-7": "AML / MDS with poor prognosis",
  "-5": "AML / MDS with poor prognosis",
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
  const abnormalities = parts.slice(2);

  // Check all parts after count for X/Y presence
  const allDescriptors = parts.slice(1).join(",");
  let sexDescription = sex;
  if (allDescriptors.includes("Y")) {
    sexDescription = "male";
  } else if (allDescriptors.includes("X")) {
    sexDescription = "female";
  }

  let description = `A karyotype of ${sexDescription} patient that has ${count} chromosomes.`;
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
  let context = "";

  // Numerical (e.g., +21, -X)
  if (part.startsWith("+")) {
    const chr = part.substring(1);
    context = CLINICAL_CONTEXT[`+${chr}`]
      ? ` (${CLINICAL_CONTEXT[`+${chr}`]})`
      : "";
    return `Gain of chromosome ${chr}${context}.`;
  }
  if (part.startsWith("-")) {
    const chr = part.substring(1);
    context = CLINICAL_CONTEXT[`-${chr}`]
      ? ` (${CLINICAL_CONTEXT[`-${chr}`]})`
      : "";
    return `Loss of chromosome ${chr}${context}.`;
  }

  // Translocation: t(9;22)(q34.1;q11.2)
  const tMatch = part.match(
    /^t\((\d+|[XY]);(\d+|[XY])\)\(([pq]\d*(?:\.\d+)?);([pq]\d*(?:\.\d+)?)\)$/,
  );
  if (tMatch) {
    const [_, chr1, chr2, band1, band2] = tMatch;
    context = CLINICAL_CONTEXT[`t(${chr1};${chr2})`]
      ? ` (${CLINICAL_CONTEXT[`t(${chr1};${chr2})`]})`
      : "";
    return `Translocation between chromosome ${chr1} at band ${band1} and chromosome ${chr2} at band ${band2}${context}.`;
  }

  // Deletion: del(5)(p15) or del(5)(q13q33)
  const delMatch = part.match(/^del\((\d+|[XY])\)\(([pq]\d*(?:\.\d+)?)(.*)\)$/);
  if (delMatch) {
    const [_, chr, band1, rest] = delMatch;
    const key = `del(${chr}${band1.startsWith("q") ? "q" : "p"})`;
    context = CLINICAL_CONTEXT[key] ? ` (${CLINICAL_CONTEXT[key]})` : "";
    return `Deletion on chromosome ${chr} at band ${band1}${rest}${context}.`;
  }

  // Inversion: inv(16)(p13q22) or inv(3)(q21q26)
  const invMatch = part.match(
    /^inv\((\d+|[XY])\)\(([pq]\d*(?:\.\d+)?)([pq]\d*(?:\.\d+)?)\)$/,
  );
  if (invMatch) {
    const [_, chr, band1, band2] = invMatch;
    context = CLINICAL_CONTEXT[`inv(${chr})`]
      ? ` (${CLINICAL_CONTEXT[`inv(${chr})`]})`
      : "";
    return `Inversion on chromosome ${chr} involving bands ${band1} and ${band2}${context}.`;
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
