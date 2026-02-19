import { useMemo, useState, useEffect } from 'react';
import { Plus, Pin, X, Users, Check, Trash2, Search, Pencil } from 'lucide-react';
import type { ApprovalDocumentType, Approver, ApprovalLine } from '@tong-pass/shared';
import { APPROVAL_DOCUMENT_TYPE_LABELS } from '@tong-pass/shared';
import { useApprovalLines, setApprovalLines, removeApprovalLine } from '@/stores/approvalLinesStore';

const TAGS: ApprovalDocumentType[] = ['GENERAL', 'RISK_ASSESSMENT', 'TBM', 'SAFETY_EDUCATION'];
const MIN_APPROVERS = 2;
const MAX_APPROVERS = 7;

// 결재직책 추천 옵션 (자유 입력 가능)
const APPROVAL_TITLE_OPTIONS = [
  '근로자 대표',
  '안전관리자',
  '안전담당자',
  '총괄책임자',
  '현장소장',
  '관리감독자',
  '공무직원',
  '보건',
  '팀장',
  '반장',
];

// Mock 사용자 데이터 (실제로는 API에서 가져옴)
const MOCK_USERS = [
  { id: 'user1', name: '김철수', position: '안전팀 과장' },
  { id: 'user2', name: '이영희', position: '현장 소장' },
  { id: 'user3', name: '박민수', position: '본부장' },
  { id: 'user4', name: '정대호', position: '일반근로자' },
  { id: 'user5', name: '최서연', position: '공무팀장' },
  { id: 'user6', name: '한수진', position: '보건관리자' },
  { id: 'user7', name: '송기범', position: '안전기사' },
];

// Mock 팀(업체) 데이터
const MOCK_TEAMS = [
  { id: 1, name: '(주)정이앤지' },
  { id: 2, name: '협력업체A' },
  { id: 3, name: '협력업체B' },
  { id: 4, name: '자체팀' },
];


interface ApprovalLineSettingsProps {
  autoOpenModal?: boolean;
  onModalAutoOpened?: () => void;
}

export default function ApprovalLineSettings({
  autoOpenModal = false,
  onModalAutoOpened,
}: ApprovalLineSettingsProps) {
  const approvalLines = useApprovalLines();
  const [filterTag, setFilterTag] = useState<ApprovalDocumentType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ApprovalLine | null>(null);

  useEffect(() => {
    if (autoOpenModal) {
      setIsFormOpen(true);
      onModalAutoOpened?.();
    }
  }, [autoOpenModal, onModalAutoOpened]);

  const filteredLines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return approvalLines.filter((line) => {
      const matchesTag = filterTag === 'ALL' || line.tags.includes(filterTag);
      if (!matchesTag) return false;
      if (!query) return true;
      const approverText = line.approvers.map((a) => `${a.userName} ${a.approvalTitle}`).join(' ');
      return (
        line.name.toLowerCase().includes(query) ||
        approverText.toLowerCase().includes(query)
      );
    });
  }, [approvalLines, filterTag, searchQuery]);

  const applyPinned = (lines: ApprovalLine[], target: ApprovalLine): ApprovalLine[] => {
    if (!target.isPinned) return lines;
    const targetTags = new Set(target.tags);
    return lines.map((line) => {
      if (line.id === target.id) return line;
      const overlaps = line.tags.some((tag) => targetTags.has(tag));
      if (!overlaps) return line;
      return { ...line, isPinned: false };
    });
  };

  const handleSaveLine = (line: ApprovalLine) => {
    const normalized = line.id ? line : { ...line, id: Date.now().toString() };
    const updated = approvalLines.some((l) => l.id === normalized.id)
      ? approvalLines.map((l) => (l.id === normalized.id ? normalized : l))
      : [...approvalLines, normalized];
    setApprovalLines(applyPinned(updated, normalized));
    setIsFormOpen(false);
    setEditingLine(null);
  };

  const handleDeleteLine = (lineId: string) => {
    if (confirm('이 결재라인을 삭제하시겠습니까?')) {
      removeApprovalLine(lineId);
    }
  };

  const handleTogglePin = (lineId: string) => {
    const target = approvalLines.find((line) => line.id === lineId);
    if (!target) return;
    const next = approvalLines.map((line) =>
      line.id === lineId ? { ...line, isPinned: !line.isPinned } : line
    );
    const updatedTarget = { ...target, isPinned: !target.isPinned };
    setApprovalLines(applyPinned(next, updatedTarget));
  };

  const handleAddNew = () => {
    setEditingLine(null);
    setIsFormOpen(true);
  };

  const handleEdit = (line: ApprovalLine) => {
    setEditingLine(line);
    setIsFormOpen(true);
  };

  if (isFormOpen) {
    return (
      <ApprovalLineForm
        editingLine={editingLine}
        onSave={handleSaveLine}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingLine(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">결재라인 설정</h2>
          <p className="text-sm text-slate-500 mt-1">태그로 문서를 연결해 여러 화면에서 재사용할 수 있습니다.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white
                     bg-gradient-to-r from-orange-500 to-orange-600
                     hover:from-orange-600 hover:to-orange-700
                     shadow-sm transition-all text-sm"
        >
          <Plus size={16} />
          결재라인 추가
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
          <Search size={16} className="text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="결재라인 검색 (이름/결재자)"
            className="text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTag('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
              filterTag === 'ALL'
                ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-white text-slate-600 border-gray-200 hover:border-orange-200'
            }`}
          >
            전체
          </button>
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                filterTag === tag
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-white text-slate-600 border-gray-200 hover:border-orange-200'
              }`}
            >
              {APPROVAL_DOCUMENT_TYPE_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-16">
                고정
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-40">
                결재라인 명칭
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-32">
                소속 팀
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-40">
                태그
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                결재자
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase w-28">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.map((line) => {
              const teamName = line.teamId
                ? MOCK_TEAMS.find(t => t.id === line.teamId)?.name
                : null;

              return (
                <tr key={line.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleTogglePin(line.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        line.isPinned ? 'bg-red-50' : 'bg-gray-100'
                      }`}
                      title="같은 태그에서 1개만 고정"
                    >
                      <Pin
                        size={16}
                        className={line.isPinned ? 'text-red-500' : 'text-slate-400'}
                        fill={line.isPinned ? 'currentColor' : 'none'}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-700">
                    {line.name}
                  </td>
                  <td className="px-4 py-4">
                    {teamName ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {teamName}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                        공용
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {line.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600"
                        >
                          {APPROVAL_DOCUMENT_TYPE_LABELS[tag]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <ApproverPreviewTable approvers={line.approvers} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleEdit(line)}
                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteLine(line.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredLines.length === 0 && (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">등록된 결재라인이 없습니다</p>
            <p className="text-sm text-slate-400 mt-1">결재라인을 추가해주세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ApproverPreviewTable({ approvers }: { approvers: Approver[] }) {
  if (approvers.length === 0) {
    return <span className="text-sm text-slate-400">결재자 없음</span>;
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

interface ApprovalLineFormProps {
  editingLine: ApprovalLine | null;
  onSave: (line: ApprovalLine) => void;
  onCancel: () => void;
}

interface ApproverSlot {
  approvalTitle: string;
  userId: string;
  userName: string;
  position: string;
}

function ApprovalLineForm({ editingLine, onSave, onCancel }: ApprovalLineFormProps) {
  const [lineName, setLineName] = useState(editingLine?.name || '');
  const [tags, setTags] = useState<ApprovalDocumentType[]>(
    editingLine?.tags || ['GENERAL']
  );
  const [teamId, setTeamId] = useState<number | null>(editingLine?.teamId ?? null);
  const [isPinned, setIsPinned] = useState(editingLine?.isPinned || false);
  const [approvers, setApprovers] = useState<ApproverSlot[]>(() => {
    if (editingLine) {
      return editingLine.approvers.map((a) => ({
        approvalTitle: a.approvalTitle,
        userId: a.userId,
        userName: a.userName,
        position: a.position,
      }));
    }
    return [
      { approvalTitle: '', userId: '', userName: '', position: '' },
      { approvalTitle: '', userId: '', userName: '', position: '' },
    ];
  });

  const [searchModalIndex, setSearchModalIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddApprover = () => {
    if (approvers.length >= MAX_APPROVERS) {
      alert(`결재자는 최대 ${MAX_APPROVERS}명까지 추가할 수 있습니다.`);
      return;
    }
    setApprovers((prev) => [
      ...prev,
      { approvalTitle: '', userId: '', userName: '', position: '' },
    ]);
  };

  const handleUpdateApprover = (index: number, updates: Partial<ApproverSlot>) => {
    setApprovers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleDeleteApprover = (targetIndex: number) => {
    setApprovers((prev) => {
      if (prev.length <= 1) {
        return [{ approvalTitle: '', userId: '', userName: '', position: '' }];
      }
      const next = [...prev];
      next.splice(targetIndex, 1);
      return next;
    });
  };

  const handleSelectUser = (index: number, user: typeof MOCK_USERS[0]) => {
    handleUpdateApprover(index, {
      userId: user.id,
      userName: user.name,
      position: user.position,
    });
    setSearchModalIndex(null);
    setSearchQuery('');
  };

  const filteredUsers = searchQuery.trim()
    ? MOCK_USERS.filter((user) =>
        `${user.name} ${user.position}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MOCK_USERS;

  const toggleTag = (tag: ApprovalDocumentType) => {
    setTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  };

  const handleSave = () => {
    if (!lineName.trim()) {
      alert('결재라인 명칭을 입력해주세요.');
      return;
    }
    if (tags.length === 0) {
      alert('최소 1개 이상의 태그를 선택해주세요.');
      return;
    }
    const validApprovers = approvers.filter((a) => a.userId && a.approvalTitle.trim());
    if (validApprovers.length < MIN_APPROVERS) {
      alert(`결재자는 최소 ${MIN_APPROVERS}명 이상 등록해야 합니다.`);
      return;
    }

    const line: ApprovalLine = {
      id: editingLine?.id || '',
      name: lineName.trim(),
      tags,
      teamId,
      isPinned,
      approvers: validApprovers.map((a) => ({
        userId: a.userId,
        userName: a.userName,
        position: a.position,
        approvalTitle: a.approvalTitle.trim(),
      })),
      createdAt: editingLine?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(line);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">
          {editingLine ? '결재라인 수정' : '결재라인 추가'}
        </h2>
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">
          닫기
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">
          결재라인 명칭 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={lineName}
          onChange={(e) => setLineName(e.target.value)}
          placeholder="예: 기본 결재라인, 야간 점검 결재"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">
          소속 팀(업체)
        </label>
        <select
          value={teamId ?? ''}
          onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">공용 (모든 팀)</option>
          {MOCK_TEAMS.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400">
          특정 팀을 선택하면 해당 팀에서만 이 결재라인을 사용할 수 있습니다.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">
          태그 선택 <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {TAGS.map((tag) => (
            <label
              key={tag}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm ${
                tags.includes(tag)
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 text-slate-600 hover:border-orange-300'
              }`}
            >
              <input
                type="checkbox"
                checked={tags.includes(tag)}
                onChange={() => toggleTag(tag)}
                className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
              />
              {APPROVAL_DOCUMENT_TYPE_LABELS[tag]}
            </label>
          ))}
        </div>
          <p className="text-xs text-slate-400">
            선택한 태그의 문서에서 이 결재라인을 불러옵니다.
          </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
          />
          자주 쓰는 결재라인으로 고정
        </label>
        <span className="text-xs text-slate-400">
          같은 태그에서 1개만 고정됩니다.
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">결재라인 지정</label>
          <p className="text-xs text-slate-400 mt-0.5">
            최소 {MIN_APPROVERS}명 / 최대 {MAX_APPROVERS}명
          </p>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-max w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                {approvers.map((_, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-sm font-medium text-slate-700 border-r border-gray-200 last:border-r-0 min-w-[160px] relative"
                  >
                    <div className="flex items-center justify-center gap-2">
                      결재자{index + 1}
                      {approvers.length > 1 && (
                        <button
                          onClick={() => handleDeleteApprover(index)}
                          className="absolute top-1 right-1 p-1 text-slate-400 hover:text-red-500
                                     hover:bg-red-50 rounded transition-colors"
                          title="삭제"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                {approvers.map((approver, index) => (
                  <td
                    key={index}
                    className="px-2 py-2 border-r border-gray-200 last:border-r-0"
                  >
                    <input
                      type="text"
                      list={`approval-title-options-${index}`}
                      value={approver.approvalTitle}
                      onChange={(e) => handleUpdateApprover(index, { approvalTitle: e.target.value })}
                      placeholder="직책을 입력하세요."
                      className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded
                                 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <datalist id={`approval-title-options-${index}`}>
                      {APPROVAL_TITLE_OPTIONS.map((title) => (
                        <option key={title} value={title} />
                      ))}
                    </datalist>
                  </td>
                ))}
              </tr>
              <tr>
                {approvers.map((approver, index) => (
                  <td
                    key={index}
                    className="px-2 py-2 border-r border-gray-200 last:border-r-0"
                  >
                    <button
                      onClick={() => setSearchModalIndex(index)}
                      className={`w-full px-3 py-2 text-sm text-center border border-gray-200 rounded
                                 hover:border-orange-400 transition-colors
                                 ${approver.userId ? 'text-slate-700' : 'text-slate-400'}`}
                    >
                      {approver.userId ? approver.userName : '결재자를 선택하세요.'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {approvers.length < MAX_APPROVERS && (
          <div className="flex justify-end">
            <button
              onClick={handleAddApprover}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus size={16} className="text-blue-600" />
              결재자 추가
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-12 py-3 text-sm font-medium text-slate-600 bg-gray-200
                     hover:bg-gray-300 rounded-lg transition-colors min-w-[140px]"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="px-12 py-3 text-sm font-medium text-white bg-orange-600
                     hover:bg-orange-700 rounded-lg transition-colors min-w-[140px]"
        >
          저장하기
        </button>
      </div>

      {searchModalIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSearchModalIndex(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-slate-800">결재자 선택</h3>
              <button
                onClick={() => setSearchModalIndex(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름 또는 직책으로 검색"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelected = approvers[searchModalIndex]?.userId === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(searchModalIndex, user)}
                      className={`w-full px-6 py-4 text-left hover:bg-orange-50 transition-colors
                                 flex items-center justify-between border-b border-gray-100 last:border-b-0
                                 ${isSelected ? 'bg-orange-50' : ''}`}
                    >
                      <div>
                        <p className={`font-medium ${isSelected ? 'text-orange-600' : 'text-slate-800'}`}>
                          {user.name}
                        </p>
                        <p className="text-sm text-slate-500">{user.position}</p>
                      </div>
                      {isSelected && <Check size={20} className="text-orange-500" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-6 py-8 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-slate-500 text-center">총 {filteredUsers.length}명의 근로자</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
