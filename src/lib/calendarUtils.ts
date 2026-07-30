export type CalendarSystem = 'gregorian' | 'local' | 'hijri';

export const ETHIOPIC_MONTHS_AM = [
  'መስከረም', 'ጥቅምት', 'ሕዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

export const ETHIOPIC_MONTHS_EN = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yakatit',
  'Magabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

export const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani',
  'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

export const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

export function getStoredCalendarSystem(): CalendarSystem {
  if (typeof window === 'undefined') return 'gregorian';
  const saved = localStorage.getItem('calendar_system');
  if (saved === 'local' || saved === 'hijri' || saved === 'gregorian') {
    return saved;
  }
  return 'gregorian';
}

export function formatDateByCalendar(
  dateInput: Date | string | number = new Date(),
  calendarSystem?: CalendarSystem,
  langCode: string = 'en'
): string {
  const cal = calendarSystem || getStoredCalendarSystem();
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput || '');

  if (cal === 'local') {
    // Ethiopic Calendar System
    try {
      const isEthiopicLang = ['am', 'ti', 'gu', 'har', 'sil'].includes(langCode);
      const locale = isEthiopicLang ? 'am-ET' : 'en-US';
      const formatter = new Intl.DateTimeFormat(`${locale}-u-ca-ethiopic`, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const formatted = formatter.format(date);
      return isEthiopicLang ? `${formatted} ዓ.ም` : `${formatted} (E.C.)`;
    } catch (e) {
      // Fallback manual Ethiopic offset approximation
      const year = date.getFullYear() - 8;
      const monthIdx = (date.getMonth() + 4) % 12;
      const monthName = ['am', 'ti'].includes(langCode) ? ETHIOPIC_MONTHS_AM[monthIdx] : ETHIOPIC_MONTHS_EN[monthIdx];
      return `${monthName} ${date.getDate()}, ${year} E.C.`;
    }
  } else if (cal === 'hijri') {
    // Hijri Calendar System
    try {
      const isArabic = langCode === 'ar';
      const locale = isArabic ? 'ar-SA' : 'en-US';
      const formatter = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const formatted = formatter.format(date);
      return isArabic ? `${formatted} هـ` : `${formatted} (A.H.)`;
    } catch (e) {
      const year = date.getFullYear() - 579;
      const monthName = langCode === 'ar' ? HIJRI_MONTHS_AR[date.getMonth()] : HIJRI_MONTHS_EN[date.getMonth()];
      return `${monthName} ${date.getDate()}, ${year} A.H.`;
    }
  } else {
    // Standard Gregorian Calendar
    try {
      const locale = langCode === 'am' ? 'am-ET' : langCode === 'om' ? 'om-ET' : 'en-US';
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return date.toLocaleDateString();
    }
  }
}

export function notifyCalendarChange(cal: CalendarSystem) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('calendar_system', cal);
    window.dispatchEvent(new CustomEvent('calendar_system_changed', { detail: { calendarSystem: cal } }));
  }
}
