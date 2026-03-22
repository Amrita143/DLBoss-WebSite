import type { ChartRecord, ChartCellStyle, ChartCellStyles } from '@/lib/types';

export const CHART_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export type ChartDayKey = (typeof CHART_DAY_KEYS)[number];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function sanitizeHexColor(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!HEX_COLOR_PATTERN.test(normalized)) {
    return null;
  }

  return normalized.toLowerCase();
}

export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) {
    return '--/--/----';
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  const dashMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMatch) {
    return `${dashMatch[1]}/${dashMatch[2]}/${dashMatch[3]}`;
  }

  return value.replaceAll('-', '/');
}

export function formatDisplayDateRange(start: string, end: string): string {
  return `${formatDisplayDate(start)} to ${formatDisplayDate(end)}`;
}

export function getVisibleDayKeys(showSunday: boolean): ChartDayKey[] {
  return showSunday ? [...CHART_DAY_KEYS] : CHART_DAY_KEYS.slice(0, 6);
}

export function getOpenDaysLabel(showSunday: boolean): string {
  return showSunday ? 'Mon - Sun' : 'Mon - Sat';
}

function parseYearValue(value: string): number | null {
  const dateMatch = value.match(/^(\d{4})-\d{2}-\d{2}$/);
  if (dateMatch) {
    return Number(dateMatch[1]);
  }

  const yearMatch = value.match(/\b(\d{4})\b/);
  return yearMatch ? Number(yearMatch[1]) : null;
}

export function getChartYearRange(records: Array<Pick<ChartRecord, 'week_start' | 'week_end'>>): string {
  if (records.length === 0) {
    return 'No Data';
  }

  let minYear: number | null = null;
  let maxYear: number | null = null;

  for (const record of records) {
    const years = [parseYearValue(record.week_start), parseYearValue(record.week_end)].filter(
      (year): year is number => year !== null && !Number.isNaN(year)
    );

    for (const year of years) {
      minYear = minYear === null ? year : Math.min(minYear, year);
      maxYear = maxYear === null ? year : Math.max(maxYear, year);
    }
  }

  if (minYear === null || maxYear === null) {
    return 'No Data';
  }

  return `${minYear} - ${maxYear}`;
}

export function normalizeChartCellStyles(input: unknown): ChartCellStyles {
  const output: ChartCellStyles = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return output;
  }

  for (const day of CHART_DAY_KEYS) {
    const rawValue = (input as Record<string, unknown>)[day];
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
      continue;
    }

    const candidate = rawValue as Record<string, unknown>;
    const textColor = sanitizeHexColor(typeof candidate.textColor === 'string' ? candidate.textColor : null);
    const highlightColor = sanitizeHexColor(typeof candidate.highlightColor === 'string' ? candidate.highlightColor : null);

    if (!textColor && !highlightColor) {
      continue;
    }

    output[day] = {
      textColor,
      highlightColor
    };
  }

  return output;
}

export function getChartCellStyle(record: Pick<ChartRecord, 'cell_styles'>, day: ChartDayKey): ChartCellStyle {
  return normalizeChartCellStyles(record.cell_styles)[day] ?? {};
}

export function parsePanelParts(value: string): { left: string; center: string; right: string } | null {
  const normalized = value.trim();
  if (!normalized || normalized === '**') {
    return null;
  }

  const splitMatch = normalized.match(/^([*\d]{3})\s*-\s*([*\d]{2})\s*-\s*([*\d]{3})$/);
  if (splitMatch) {
    return {
      left: splitMatch[1],
      center: splitMatch[2],
      right: splitMatch[3]
    };
  }

  const compact = normalized.replace(/[^\d*]/g, '');
  if (compact.length === 8) {
    return {
      left: compact.slice(0, 3),
      center: compact.slice(3, 5),
      right: compact.slice(5, 8)
    };
  }

  return null;
}
