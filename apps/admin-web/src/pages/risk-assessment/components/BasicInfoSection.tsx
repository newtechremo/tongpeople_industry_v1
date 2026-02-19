/**
 * 기본 정보 섹션 - 최초 위험성평가
 *
 * 현장명, 업체, 소속회사, 결재라인, 작업기간, 위험성 수준
 */

import { Calendar } from 'lucide-react';
import ApprovalLineDisplay from '@/components/approval/ApprovalLineDisplay';
import type { Approver } from '@tong-pass/shared';

interface BasicInfoSectionProps {
  assessmentTitle?: string;
  siteName: string;
  teamName?: string;
  companyName: string;
  approvalLineName: string | null;
  approvalLineCount: number | null;
  approvalLineApprovers: Approver[];
  workPeriodStart: string;
  workPeriodEnd: string;
  onApprovalLineChange: () => void;
  onDateChange: (field: 'start' | 'end', value: string) => void;
  canChangeApprovalLine?: boolean;
  disableStartDate?: boolean;
  disableEndDate?: boolean;
  signatures?: Record<string, string>;
  onApplySignature?: (userId: string) => void;
  canEdit?: boolean;
}

export default function BasicInfoSection({
  assessmentTitle,
  siteName,
  teamName,
  companyName,
  approvalLineName,
  approvalLineCount,
  approvalLineApprovers,
  workPeriodStart,
  workPeriodEnd,
  onApprovalLineChange,
  onDateChange,
  canChangeApprovalLine = true,
  disableStartDate = false,
  disableEndDate = false,
  signatures = {},
  onApplySignature,
  canEdit = true,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h3 className="text-lg font-bold text-slate-700">기본 정보</h3>

      {assessmentTitle && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-600 w-24">평가명</label>
          <span className="text-slate-800">{assessmentTitle}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-600 w-24">현장명</label>
        <span className="text-slate-800">{siteName}</span>
      </div>

      {teamName && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-600 w-24">업체</label>
          <span className="text-slate-800">{teamName}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-600 w-24">소속 회사</label>
        <span className="text-slate-800">{companyName}</span>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-600 w-24">결재 라인</label>
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm text-slate-700">
            {approvalLineName
              ? `${approvalLineName}${approvalLineCount ? ` · ${approvalLineCount}명` : ''}`
              : '선택된 결재라인 없음'}
          </span>
          {canChangeApprovalLine && (
            <button
              type="button"
              onClick={onApprovalLineChange}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
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
        <label className="block text-sm font-medium text-slate-600 mb-2">작업 기간</label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={workPeriodStart}
              onChange={(e) => onDateChange('start', e.target.value)}
              disabled={disableStartDate}
              className="px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-slate-500"
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
              className="px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-slate-500"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
