import type { Approver } from '@tong-pass/shared';

interface ApproverPreviewTableProps {
  approvers: Approver[];
  emptyLabel?: string;
}

export function ApproverPreviewTable({
  approvers,
  emptyLabel = '결재자 없음',
}: ApproverPreviewTableProps) {
  if (approvers.length === 0) {
    return <span className="text-sm text-slate-400">{emptyLabel}</span>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-max border border-gray-200 rounded">
        <thead>
          <tr className="bg-gray-100">
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
          <tr>
            {approvers.map((approver, index) => (
              <td
                key={index}
                className="px-4 py-2 text-xs text-slate-500 border-r border-gray-200 last:border-r-0 text-center"
              >
                {approver.userName}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
