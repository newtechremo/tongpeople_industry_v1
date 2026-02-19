import { useState } from 'react';
import type { Approver } from '@tong-pass/shared';
import { Users } from 'lucide-react';

interface ApprovalLineDisplayProps {
  mode: 'preview' | 'document';
  approvers: Approver[];
  signatures?: Record<string, string>;
  onApplySignature?: (userId: string) => void;
  canEdit?: boolean;
}

export default function ApprovalLineDisplay({
  mode,
  approvers,
  signatures = {},
  onApplySignature,
  canEdit = false,
}: ApprovalLineDisplayProps) {
  if (approvers.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg py-12 text-center">
        <Users size={32} className="mx-auto mb-2 text-slate-300" />
        <p className="text-sm text-slate-400">결재자가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-x-auto">
      <table className="min-w-max w-full text-sm">
        {/* 헤더: 결재 직책 */}
        <thead>
          <tr className="bg-gray-50">
            {approvers.map((approver, index) => (
              <th
                key={index}
                className="px-4 py-2 text-xs font-medium text-slate-600 border-r border-gray-200 last:border-r-0 min-w-[100px]"
              >
                {approver.approvalTitle}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* 이름 행 */}
          <tr className="border-b border-gray-200">
            {approvers.map((approver, index) => (
              <td
                key={index}
                className="px-4 py-2 text-xs text-slate-500 border-r border-gray-200 last:border-r-0 text-center"
              >
                {approver.userName}
              </td>
            ))}
          </tr>

          {/* 서명 행 (document 모드만) */}
          {mode === 'document' && (
            <tr>
              {approvers.map((approver, index) => (
                <td
                  key={index}
                  className="px-4 py-3 border-r border-gray-200 last:border-r-0 text-center"
                >
                  <SignatureCell
                    approver={approver}
                    signature={signatures[approver.userId]}
                    onApplySignature={onApplySignature}
                    canEdit={canEdit}
                  />
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

interface SignatureCellProps {
  approver: Approver;
  signature?: string;
  onApplySignature?: (userId: string) => void;
  canEdit: boolean;
}

function SignatureCell({
  approver,
  signature,
  onApplySignature,
  canEdit,
}: SignatureCellProps) {
  const [imageError, setImageError] = useState(false);

  if (signature && !imageError) {
    return (
      <div className="flex flex-col items-center gap-1">
        <img
          src={signature}
          alt={`${approver.userName} 서명`}
          className="h-10 object-contain"
          onError={() => setImageError(true)}
        />
        <p className="text-xs text-slate-400">{approver.userName}</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="h-10 flex items-center">
          <p className="text-xs text-slate-400">서명 없음</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-slate-500">서명 필요</p>
      <button
        onClick={() => onApplySignature?.(approver.userId)}
        className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50
                   hover:bg-orange-100 rounded-lg transition-colors"
      >
        서명 불러오기
      </button>
    </div>
  );
}
