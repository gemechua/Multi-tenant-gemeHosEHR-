/**
 * Schema Code Formatter & Automated Audit Counter Service
 * Formats and assigns alphanumeric codes (1.1.1 to 1.1.1.z) to records based on their category
 * starting after table initialization. Prevents duplication and enforces unique sequential indices.
 */

export interface SchemaRecordWithCode {
  id: string;
  schemaCode: string;
  category: string;
  [key: string]: any;
}

/**
 * Formats a sequence index into the required 1.1.1 to 1.1.1.z alphanumeric schema code format.
 * - Indices 1 to 26 map to letters a through z.
 * - Index > 26 maps to double letters or extended suffix (e.g., aa, ab, etc.).
 */
export function formatSchemaAlphanumericCode(categoryPrefix: string, index: number): string {
  // categoryPrefix e.g. "1.1.1"
  const safeIndex = Math.max(1, index);
  
  // Convert 1-26 to 'a'-'z', >26 to 'aa', 'ab', etc.
  let suffix = '';
  let n = safeIndex;
  while (n > 0) {
    let modulo = (n - 1) % 26;
    suffix = String.fromCharCode(97 + modulo) + suffix;
    n = Math.floor((n - modulo) / 26);
    if (n === 0 && safeIndex > 26 && suffix.length === 1) {
      // ensure proper multi-char for >26 if needed, or simple letter suffix
    }
    break; // for standard 1 to 26 ('a' to 'z'), or we can do standard alphabetical suffix
  }

  // Simpler 1.1.1.a to 1.1.1.z mapping:
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const letterIndex = (safeIndex - 1) % 26;
  const cycle = Math.floor((safeIndex - 1) / 26);
  
  let letterSuffix = alphabet[letterIndex];
  if (cycle > 0) {
    const prevLetter = alphabet[Math.min(cycle - 1, 25)];
    letterSuffix = prevLetter + letterSuffix;
  }

  return `${categoryPrefix}.${letterSuffix}`;
}

/**
 * Assigns unique sequential schema codes to an array of records starting after initialization.
 */
export function assignSequentialSchemaCodes<T extends Record<string, any>>(
  records: T[],
  categoryPrefix: string = '1.1.1'
): (T & { schemaCode: string })[] {
  const seenCodes = new Set<string>();
  
  return records.map((record, idx) => {
    // Start numbering after table initialization (index 1 -> 1.1.1.a)
    const sequentialIndex = idx + 1;
    let code = formatSchemaAlphanumericCode(categoryPrefix, sequentialIndex);
    
    // Integrity guard against duplication
    let counter = 1;
    while (seenCodes.has(code)) {
      code = formatSchemaAlphanumericCode(categoryPrefix, sequentialIndex + counter);
      counter++;
    }
    
    seenCodes.add(code);
    return {
      ...record,
      schemaCode: record.schemaCode || code,
    };
  });
}

/**
 * Automated audit counter service that iterates through clinical register records
 * and calculates total initial counts based on 1.1.1 to 1.1.1.z progression.
 */
export function calculateSchemaAuditCounts(records: any[]): {
  totalCount: number;
  categoryCounts: Record<string, number>;
  latestCode: string;
} {
  if (!Array.isArray(records) || records.length === 0) {
    return { totalCount: 0, categoryCounts: {}, latestCode: '1.1.1.a' };
  }

  const categoryCounts: Record<string, number> = {};
  let totalCount = 0;

  records.forEach((rec, idx) => {
    const cat = rec.category || rec.department || 'General Clinical Register';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    totalCount++;
  });

  const latestCode = formatSchemaAlphanumericCode('1.1.1', totalCount);

  return {
    totalCount,
    categoryCounts,
    latestCode,
  };
}

/**
 * Data integrity validation guard to prevent record duplication in register tables.
 */
export function validateNewRecordUniqueCode(existingRecords: any[], newRecord: any, categoryPrefix: string = '1.1.1'): string {
  const existingCodes = new Set(existingRecords.map(r => r.schemaCode).filter(Boolean));
  const nextIndex = existingRecords.length + 1;
  let candidateCode = formatSchemaAlphanumericCode(categoryPrefix, nextIndex);

  let attempt = 0;
  while (existingCodes.has(candidateCode)) {
    attempt++;
    candidateCode = formatSchemaAlphanumericCode(categoryPrefix, nextIndex + attempt);
  }

  return candidateCode;
}
