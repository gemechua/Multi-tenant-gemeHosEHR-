/**
 * Audit Counter Service & Alphanumeric Schema Code Formatter
 * Implements 1.1.1 to 1.1.1.z alphanumeric progression logic, record ID assignment,
 * data integrity validation guards against duplication, and automated audit counts
 * for Admin Dashboard integration.
 */

export interface ClinicalAuditRecord {
  id: string;
  schemaCode: string;
  category: string;
  [key: string]: any;
}

/**
 * Formats sequence index into 1.1.1 to 1.1.1.z alphanumeric schema code format.
 */
export function formatAuditAlphanumericCode(prefix: string = '1.1.1', index: number): string {
  const safeIndex = Math.max(1, index);
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const letterIndex = (safeIndex - 1) % 26;
  const cycle = Math.floor((safeIndex - 1) / 26);
  
  let letterSuffix = alphabet[letterIndex];
  if (cycle > 0) {
    const prevLetter = alphabet[Math.min(cycle - 1, 25)];
    letterSuffix = prevLetter + letterSuffix;
  }

  return `${prefix}.${letterSuffix}`;
}

/**
 * Assigns unique sequential schema codes starting after table initialization.
 */
export function assignAuditSchemaCodes<T extends Record<string, any>>(
  records: T[],
  prefix: string = '1.1.1'
): (T & { schemaCode: string })[] {
  // Filter out any mock test records
  const validRecords = records.filter(r => {
    const isMock = r.isMock || r.patient_name?.toLowerCase().includes('demo') || r.id?.toString().includes('demo');
    return !isMock;
  });

  const seenCodes = new Set<string>();

  return validRecords.map((record, idx) => {
    const sequentialIndex = idx + 1;
    let code = formatAuditAlphanumericCode(prefix, sequentialIndex);

    let attempt = 0;
    while (seenCodes.has(code)) {
      attempt++;
      code = formatAuditAlphanumericCode(prefix, sequentialIndex + attempt);
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
 * and calculates total initial counts and per-category stats based on 1.1.1 to 1.1.1.z progression.
 */
export function calculateRegisterAuditSummary(records: any[]): {
  totalCount: number;
  categoryCounts: Record<string, number>;
  latestCode: string;
} {
  const liveRecords = records.filter(r => {
    const isMock = r.isMock || r.patient_name?.toLowerCase().includes('demo') || r.id?.toString().includes('demo');
    return !isMock;
  });

  if (!Array.isArray(liveRecords) || liveRecords.length === 0) {
    return { totalCount: 0, categoryCounts: {}, latestCode: '1.1.1.a' };
  }

  const categoryCounts: Record<string, number> = {};
  let totalCount = 0;

  liveRecords.forEach((rec) => {
    const cat = rec.category || rec.department || rec.opd_unit || 'General Clinical Register';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    totalCount++;
  });

  const latestCode = formatAuditAlphanumericCode('1.1.1', totalCount);

  return {
    totalCount,
    categoryCounts,
    latestCode,
  };
}

/**
 * Data integrity validation guard to prevent record duplication by verifying unique sequential index.
 */
export function validateAndAssignUniqueRecordCode(existingRecords: any[], newRecord: any, prefix: string = '1.1.1'): string {
  const liveExisting = existingRecords.filter(r => !r.isMock && !r.id?.toString().includes('demo'));
  const existingCodes = new Set(liveExisting.map(r => r.schemaCode).filter(Boolean));
  const nextIndex = liveExisting.length + 1;
  let candidateCode = formatAuditAlphanumericCode(prefix, nextIndex);

  let attempt = 0;
  while (existingCodes.has(candidateCode)) {
    attempt++;
    candidateCode = formatAuditAlphanumericCode(prefix, nextIndex + attempt);
  }

  return candidateCode;
}
