/**
 * 기본 정보 섹션 - 최초 위험성평가
 *
 * 현장명, 소속(회사+팀), 결재라인, 작업기간, 위험성 수준
 */

import { Calendar, ChevronDown } from 'lucide-react';
import ApprovalLineDisplay from '@/components/approval/ApprovalLineDisplay';
import type { Approver } from '@tong-pass/shared';

interface Team {
  id: string;
  name: string;
}

interface BasicInfoSectionProps {
  assessmentTitle?: string;
  siteName: string;
  companyName: string;
  teamId?: string;
  teams?: Team[];
  approvalLineName: string | null;
  approvalLineCount: number | null;
  approvalLineApprovers: Approver[];
  workPeriodStart: string;
  workPeriodEnd: string;
  onApprovalLineChange: () => void;
  onDateChange: (field: 'start' | 'end', value: string) => void;
  onTeamChange?: (teamId: string) => void;
  canChangeApprovalLine?: boolean;
  canChangeTeam?: boolean;
  disableStartDate?: boolean;
  disableEndDate?: boolean;
  signatures?: Record<string, string>;
  onApplySignature?: (userId: string) => void;
  canEdit?: boolean;
  compact?: boolean;
  embedded?: boolean;
  hideSectionTitle?: boolean;
}

export default function BasicInfoSection({
  assessmentTitle,
  siteName,
  companyName,
  teamId,
  teams = [],
  approvalLineName,
  approvalLineCount,
  approvalLineApprovers,
  workPeriodStart,
  workPeriodEnd,
  onApprovalLineChange,
  onDateChange,
  onTeamChange,
  canChangeApprovalLine = true,
  canChangeTeam = true,
  disableStartDate = false,
  disableEndDate = false,
  signatures = {},
  onApplySignature,
  canEdit = true,
  compact = false,
  embedded = false,
  hideSectionTitle = false,
}: BasicInfoSectionProps) {
  const selectedTeam = teams.find(t => t.id === teamId);
  const teamDisplayText = teamId && teamId !== 'all'
    ? selectedTeam?.name || '선택된 팀'
    : '전체 (팀 미지정)';
  const containerClass = embedded
    ? compact
      ? 'space-y-4'
      : 'space-y-6'
    : compact
      ? 'bg-white rounded-xl border border-gray-200 p-4 space-y-4'
      : 'bg-white rounded-xl border border-gray-200 p-6 space-y-6';
  const rowLabelClass = compact
    ? 'text-sm font-medium text-slate-600 w-20'
    : 'text-base font-medium text-slate-600 w-24';
  const sectionTitleClass = compact
    ? 'text-lg font-bold text-slate-700'
    : 'text-xl font-bold text-slate-700';
  const inputClass = compact
    ? 'px-3 py-1.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none bg-white'
    : 'px-3 py-1.5 pr-8 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none bg-white';
  const dateInputClass = compact
    ? 'px-3 py-1.5 pr-9 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-slate-500'
    : 'px-4 py-2 pr-10 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-slate-500';
  return (
    <div className={containerClass}>
      {!hideSectionTitle && <h3 className={sectionTitleClass}>기본 정보</h3>}

      {assessmentTitle && (
        <div className="flex items-center gap-4">
          <label className={rowLabelClass}>평가명</label>
          <span className="text-slate-800">{assessmentTitle}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className={rowLabelClass}>현장명</label>
        <span className="text-slate-800">{siteName}</span>
      </div>

      <div className="flex items-center gap-4">
        <label className={rowLabelClass}>소속</label>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-slate-800">{companyName}</span>
          <span className="text-slate-400">/</span>
          {canChangeTeam && onTeamChange ? (
            <div className="relative flex-1 max-w-xs">
              <select
                value={teamId || 'all'}
                onChange={(e) => onTeamChange(e.target.value)}
                className={`w-full ${inputClass}`}
              >
                <option value="all">전체 (팀 미지정)</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          ) : (
            <span className="text-slate-800">{teamDisplayText}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className={rowLabelClass}>결재 라인</label>
        <div className="flex items-center gap-3 flex-1">
          <span className={compact ? 'text-sm text-slate-700' : 'text-base text-slate-700'}>
            {approvalLineName
              ? `${approvalLineName}${approvalLineCount ? ` · ${approvalLineCount}명` : ''}`
              : '선택된 결재라인 없음'}
          </span>
          {canChangeApprovalLine && (
            <button
              type="button"
              onClick={onApprovalLineChange}
              className="text-base text-orange-600 hover:text-orange-700 font-medium"
            >
              결재라인 변경
            </button>
          )}
        </div>
      </div>

      <ApprovalLineDisplay
        mode={onApplySignature ? 'document' : 'preview'}
        approvers={approvalLineApprovers}
        signatures={signatures}
        onApplySignature={onApplySignature}
        canEdit={canEdit}
      />

      <div>
        <label className={compact ? 'block text-sm font-medium text-slate-600 mb-2' : 'block text-base font-medium text-slate-600 mb-2'}>작업 기간</label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={workPeriodStart}
              onChange={(e) => onDateChange('start', e.target.value)}
              disabled={disableStartDate}
              className={dateInputClass}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <span className="text-slate-500">~</span>
          <div className="relative">
            <input
              type="date"
              value={workPeriodEnd}
              onChange={(e) => onDateChange('end', e.target.value)}
              disabled={disableEndDate}
              className={dateInputClass}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
