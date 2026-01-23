import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import type { ApprovalLine } from '@tong-pass/shared';
import { APPROVAL_DOCUMENT_TYPE_LABELS } from '@tong-pass/shared';

// Mock 팀(업체) 데이터
const MOCK_TEAMS = [
  { id: 1, name: '(주)정이앤지' },
  { id: 2, name: '협력업체A' },
  { id: 3, name: '협력업체B' },
  { id: 4, name: '자체팀' },
];

interface ApprovalLineSelectModalProps {
  isOpen: boolean;
  lines: ApprovalLine[];
  selectedId: string | null;
  onSelect: (line: ApprovalLine) => void;
  onClose: () => void;
  onCreate: () => void;
}

export default function ApprovalLineSelectModal({
  isOpen,
  lines,
  selectedId,
  onSelect,
  onClose,
  onCreate,
}: ApprovalLineSelectModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return lines;
    return lines.filter((line) => {
      const approverText = line.approvers
        .map((approver) => `${approver.userName} ${approver.approvalTitle}`)
        .join(' ')
        .toLowerCase();
      return (
        line.name.toLowerCase().includes(keyword) ||
        approverText.includes(keyword)
      );
    });
  }, [lines, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-slate-800">결재라인 선택</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {lines.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="결재라인 검색 (이름/결재자)"
                className="text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          {lines.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-500 font-medium">결재라인이 없습니다</p>
              <p className="text-sm text-slate-400 mt-1">
                먼저 결재라인을 만들어 주세요.
              </p>
              <button
                onClick={onCreate}
                className="mt-4 px-4 py-2 rounded-lg font-bold text-white bg-orange-600 hover:bg-orange-700"
              >
                결재라인 만들기
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((line) => {
                const isSelected = selectedId === line.id;
                const teamName = line.teamId
                  ? MOCK_TEAMS.find(t => t.id === line.teamId)?.name
                  : null;

                return (
                  <button
                    key={line.id}
                    onClick={() => onSelect(line)}
                    className={`w-full px-6 py-4 text-left hover:bg-orange-50 transition-colors ${
                      isSelected ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800">{line.name}</span>
                          {line.isPinned && (
                            <span className="text-xs font-semibold text-red-500">고정</span>
                          )}
                          {teamName ? (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                              {teamName}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                              공용
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {line.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600"
                            >
                              {APPROVAL_DOCUMENT_TYPE_LABELS[tag]}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          {line.approvers.map((approver) => approver.userName).join(' · ')}
                        </p>
                      </div>
                      {isSelected && <Check size={18} className="text-orange-500 mt-1" />}
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-400">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-gray-200 hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
