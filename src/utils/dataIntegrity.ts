/**
 * Data Integrity Utility
 * Prevents recording, counting, or displaying false or fake information.
 */

export const FAKE_KEYWORDS = [
  'fake',
  'mock',
  'test',
  'dummy',
  'false',
  'invalid',
  'error',
  'falsified',
  'placeholder',
  'sample',
  'demo',
  'mockup',
  'temp',
  'trash',
  'junk',
  'garbage',
  'testing',
  'example',
  'beta',
  'experimental'
];

/**
 * Checks if a single string or value represents fake/false information.
 */
export function isFakeOrFalseValue(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    return FAKE_KEYWORDS.some(kw => lower.includes(kw));
  }
  return false;
}

/**
 * Checks if a record/row contains fake or false information in any of its meaningful fields.
 */
export function isFakeOrFalseRow(row: any): boolean {
  if (!row || typeof row !== 'object') return false;
  
  const ignoredKeys = [
    'id', 'uuid', 'key', 'sNo', 's_no', 'serial', 'serialNumber', 'createdAt', 'updatedAt', 
    'userId', 'userEmail', 'hospital_id', 'hospitalId', 'updated_at', 'created_at'
  ];

  return Object.entries(row).some(([key, val]) => {
    if (ignoredKeys.includes(key)) return false;
    
    // If nested object, check recursively
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return isFakeOrFalseRow(val);
    }
    
    if (Array.isArray(val)) {
      return val.some(item => {
        if (typeof item === 'object') return isFakeOrFalseRow(item);
        return isFakeOrFalseValue(item);
      });
    }

    return isFakeOrFalseValue(val);
  });
}

/**
 * Filters out fake or false rows from an array.
 */
export function filterFakeOrFalseRows<T>(rows: T[]): T[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => !isFakeOrFalseRow(row));
}

/**
 * Counts only valid (non-fake/non-false) records.
 */
export function countValidRows<T>(rows: T[]): number {
  return filterFakeOrFalseRows(rows).length;
}

/**
 * Checks if any record in an array is fake or false.
 */
export function hasAnyFakeOrFalseRow<T>(rows: T[]): boolean {
  if (!Array.isArray(rows)) return false;
  return rows.some(isFakeOrFalseRow);
}
