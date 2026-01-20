import { useSyncExternalStore } from 'react';
import type { ApprovalLine } from '@tong-pass/shared';
import { mockApprovalLines } from '@/mocks/approval-lines';

const STORAGE_KEY = 'tong-pass:approval-lines';

type Subscriber = () => void;

let approvalLines: ApprovalLine[] = loadInitial();
const subscribers = new Set<Subscriber>();

function loadInitial(): ApprovalLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return mockApprovalLines;
    const parsed = JSON.parse(raw) as ApprovalLine[];
    if (!Array.isArray(parsed)) return mockApprovalLines;
    return parsed;
  } catch {
    return mockApprovalLines;
  }
}

function persist(next: ApprovalLine[]) {
  approvalLines = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors in local dev.
  }
  subscribers.forEach((listener) => listener());
}

function subscribe(listener: Subscriber) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return approvalLines;
}

export function useApprovalLines() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function upsertApprovalLine(line: ApprovalLine) {
  const exists = approvalLines.some((item) => item.id === line.id);
  const next = exists
    ? approvalLines.map((item) => (item.id === line.id ? line : item))
    : [...approvalLines, { ...line, id: line.id || Date.now().toString() }];
  persist(next);
}

export function removeApprovalLine(lineId: string) {
  persist(approvalLines.filter((line) => line.id !== lineId));
}

export function setApprovalLines(lines: ApprovalLine[]) {
  persist(lines);
}
