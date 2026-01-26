import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileDown, Trash2, RotateCcw, Calendar } from 'lucide-react';
import BasicInfoSection from './components/BasicInfoSection';
import ApprovalLineSelectModal from './modals/ApprovalLineSelectModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getAssessmentById, type MockRiskAssessment } from '@/mocks/risk-assessment';
import { useApprovalLines } from '@/stores/approvalLinesStore';
import type { ApprovalLine, Approver } from '@tong-pass/shared';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pre_start: { label: '작업기간 전', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '작업기간 중', className: 'bg-orange-100 text-orange-700' },
  completed: { label: '작업종료', className: 'bg-gray-100 text-gray-600' },
};

const TYPE_LABELS: Record<string, string> = {
  INITIAL: '최초',
  ADHOC: '수시',
  FREQUENCY_INTENSITY: '정기',
};

const SIGNATURE_STORAGE_PREFIX = 'tong-pass:signature:';
const LOCAL_STORAGE_PREFIX = 'risk-assessment:draft:';

interface LocalRiskFactor {
  id: string;
  factor: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  improvement: string;
  workPeriodStart: string;
  workPeriodEnd: string;
}

interface LocalSubcategory {
  id: number;
  name: string;
  riskFactors: LocalRiskFactor[];
}

interface LocalCategory {
  id: string;
  categoryId: number | null;
  categoryName: string;
  subcategories: LocalSubcategory[];
}

interface LocalAssessmentDraft {
  id: string;
  type: string;
  created_at: string;
  status: string;
  title?: string;
  siteName: string;
  companyName: string;
  approvalLineId: string | null;
  workPeriodStart: string;
  workPeriodEnd: string;
  categories: LocalCategory[];
}

function getWorkflowStatus(startDate: string, endDate: string) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'in_progress' as const;
  }

  if (today < start) return 'pre_start' as const;
  if (today > end) return 'completed' as const;
  return 'in_progress' as const;
}

function loadSignature(userId: string) {
  try {
    return localStorage.getItem(`${SIGNATURE_STORAGE_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

function loadLocalAssessment(id: string): LocalAssessmentDraft | null {
  try {
    const stored = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${id}`);
    if (!stored) return null;
    return JSON.parse(stored) as LocalAssessmentDraft;
  } catch {
    return null;
  }
}

function buildItemsFromCategories(categories: LocalCategory[]) {
  return categories.flatMap((category) =>
    category.subcategories.flatMap((subcategory) =>
      subcategory.riskFactors.map((factor) => ({
        id: factor.id,
        risk_factor_name: factor.factor,
        measures: factor.improvement,
        accident_type: subcategory.name || category.categoryName,
        level: factor.level,
      }))
    )
  );
}

function SignatureBox({
  approver,
  signature,
  onApply,
  disabled,
}: {
  approver: Approver;
  signature: string | null;
  onApply: () => void;
  disabled: boolean;
}) {
  const storedSignature = loadSignature(approver.userId);
  const canApply = Boolean(storedSignature) && !disabled && !signature;

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-3 min-h-[72px] flex flex-col justify-between">
      {signature ? (
        <div className="text-base text-slate-700">
          {signature.startsWith('data:image') ? (
            <img src={signature} alt="전자서명" className="h-10 object-contain" />
          ) : (
            <span className="font-semibold">{signature}</span>
          )}
        </div>
      ) : (
        <span className="text-sm text-slate-400">서명 필요</span>
      )}
      <button
        type="button"
        onClick={onApply}
        disabled={!canApply}
        title={storedSignature ? '' : '저장된 서명이 없습니다.'}
        className="mt-2 text-sm font-bold text-orange-600 hover:text-orange-700 disabled:text-slate-300"
      >
        서명 불러오기
      </button>
    </div>
  );
}

export default function RiskAssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const localAssessment = useMemo(() => (id ? loadLocalAssessment(id) : null), [id]);
  const assessment = useMemo(
    () => (localAssessment || !id ? undefined : getAssessmentById(id)),
    [id, localAssessment]
  );
  const displayOverrides: Record<string, Partial<MockRiskAssessment>> = {
    'ra-1': {
      site_name: '통사통 사현장',
      team_name: '(주)대정이앤씨',
      creator_name: '홍길동',
      category_name: '건설작업',
      subcategory_name: '철근작업',
    },
    'ra-2': {
      site_name: '통사통 사현장',
      team_name: '협력업체 A',
      creator_name: '김철수',
      category_name: '제조작업',
      subcategory_name: '프레스 가공',
    },
  };

  const approvalLines = useApprovalLines();
  const availableApprovalLines = useMemo(() => approvalLines, [approvalLines]);

  const defaultApprovalLine = useMemo(() => {
    const pinned = availableApprovalLines.find((line) => line.isPinned);
    return pinned || availableApprovalLines[0] || null;
  }, [availableApprovalLines]);

  const [selectedApprovalLine, setSelectedApprovalLine] = useState<ApprovalLine | null>(defaultApprovalLine);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingApprovalLine, setPendingApprovalLine] = useState<ApprovalLine | null>(null);
  const [showLineChangeWarning, setShowLineChangeWarning] = useState(false);
  const [appliedSignatures, setAppliedSignatures] = useState<Record<string, string>>({});
  const [workPeriodStart, setWorkPeriodStart] = useState(
    localAssessment?.workPeriodStart || assessment?.work_start_date || ''
  );
  const [workPeriodEnd, setWorkPeriodEnd] = useState(
    localAssessment?.workPeriodEnd || assessment?.work_end_date || ''
  );
  const [items, setItems] = useState(
    localAssessment ? buildItemsFromCategories(localAssessment.categories) : assessment?.items || []
  );

  useEffect(() => {
    if (!selectedApprovalLine || !availableApprovalLines.some((line) => line.id === selectedApprovalLine.id)) {
      setSelectedApprovalLine(defaultApprovalLine);
      setAppliedSignatures({});
    }
  }, [availableApprovalLines, defaultApprovalLine, selectedApprovalLine]);
  useEffect(() => {
    if (localAssessment) {
      setWorkPeriodStart(localAssessment.workPeriodStart);
      setWorkPeriodEnd(localAssessment.workPeriodEnd);
      setItems(buildItemsFromCategories(localAssessment.categories));
    } else if (assessment) {
      setWorkPeriodStart(assessment.work_start_date || '');
      setWorkPeriodEnd(assessment.work_end_date || '');
      setItems(assessment.items || []);
    }
  }, [localAssessment, assessment]);

  useEffect(() => {
    if (!localAssessment?.approvalLineId) return;
    const match = availableApprovalLines.find((line) => line.id === localAssessment.approvalLineId);
    if (match) {
      setSelectedApprovalLine(match);
    }
  }, [availableApprovalLines, localAssessment]);
  if (!assessment && !localAssessment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-slate-800">위험성평가 상세</h1>
          <button
            type="button"
            onClick={() => navigate('/safety/risk')}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-gray-100 hover:bg-gray-200"
          >
            목록으로
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-slate-500">
          문서를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const mergedAssessment = assessment?.id && displayOverrides[assessment.id]
    ? { ...assessment, ...displayOverrides[assessment.id] }
    : assessment;

  const documentId = localAssessment?.id || assessment?.id || id || '';
  const assessmentType = localAssessment?.type || mergedAssessment?.type || 'INITIAL';
  const displaySiteName = localAssessment?.siteName || mergedAssessment?.site_name || '';
  const displayCompanyName = localAssessment?.companyName || '(주)통하는사람들';
  const displayTeamName = localAssessment ? undefined : mergedAssessment?.team_name;

  const workflowStatus = getWorkflowStatus(workPeriodStart, workPeriodEnd);
  const statusInfo = STATUS_LABELS[workflowStatus];
  const canEdit = workflowStatus !== 'completed';
  const canRewrite = workflowStatus === 'completed';
  const disableStartDate = workflowStatus === 'in_progress' || workflowStatus === 'completed';
  const disableEndDate = workflowStatus === 'completed';

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const nextStart = field === 'start' ? value : workPeriodStart;
    const nextEnd = field === 'end' ? value : workPeriodEnd;
    if (nextStart && nextEnd && new Date(nextStart) > new Date(nextEnd)) {
      window.alert('작업기간 종료일은 시작일 이후여야 합니다.');
      return;
    }
    if (field === 'start') setWorkPeriodStart(value);
    if (field === 'end') setWorkPeriodEnd(value);
  };

  const handleApprovalLineSelect = (line: ApprovalLine) => {
    if (Object.keys(appliedSignatures).length > 0) {
      setPendingApprovalLine(line);
      setShowLineChangeWarning(true);
      setApprovalModalOpen(false);
      return;
    }
    setSelectedApprovalLine(line);
    setApprovalModalOpen(false);
    setAppliedSignatures({});
  };

  const confirmApprovalLineChange = () => {
    if (pendingApprovalLine) {
      setSelectedApprovalLine(pendingApprovalLine);
      setAppliedSignatures({});
    }
    setPendingApprovalLine(null);
    setApprovalModalOpen(false);
  };

  const handleApplySignature = (approverId: string) => {
    const stored = loadSignature(approverId);
    if (!stored) {
      window.alert('저장된 서명이 없습니다. 먼저 서명을 등록해주세요.');
      return;
    }
    setAppliedSignatures((prev) => ({ ...prev, [approverId]: stored }));
  };

  const approvalLineApprovers = selectedApprovalLine?.approvers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/safety/risk')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">위험성평가 상세</h1>
            <p className="text-base text-slate-500 mt-1">문서 번호: {documentId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/safety/risk')}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-gray-100 hover:bg-gray-200"
          >
            목록
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-white border border-gray-200 hover:bg-gray-50"
          >
            <FileDown size={16} className="inline mr-1" />
            출력
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600"
          >
            <Trash2 size={16} className="inline mr-1" />
            삭제
          </button>
          {canRewrite && (
            <button
              type="button"
              className="px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <RotateCcw size={16} className="inline mr-1" />
              재작성
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-sm font-medium rounded ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          <span className="text-base text-slate-500">{TYPE_LABELS[assessmentType] || assessmentType} 위험성평가</span>
        </div>
      </div>

      <BasicInfoSection
        assessmentTitle={localAssessment?.title || mergedAssessment?.title || ''}
        siteName={displaySiteName}
        teamName={displayTeamName}
        companyName={displayCompanyName}
        approvalLineName={selectedApprovalLine?.name || null}
        approvalLineCount={selectedApprovalLine?.approvers.length || null}
        approvalLineApprovers={approvalLineApprovers.map((approver) => ({
          approvalTitle: approver.approvalTitle,
          userName: approver.userName,
          userId: approver.userId,
          position: approver.position,
        }))}
        workPeriodStart={workPeriodStart}
        workPeriodEnd={workPeriodEnd}
        onApprovalLineChange={() => setApprovalModalOpen(true)}
        onDateChange={handleDateChange}
        canChangeApprovalLine={canEdit}
        disableStartDate={disableStartDate}
        disableEndDate={disableEndDate}
        signatures={appliedSignatures}
        onApplySignature={handleApplySignature}
        canEdit={canEdit}
      />

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-700">작업 공종</h2>

        {localAssessment ? (
          <div className="space-y-6">
            {localAssessment.categories.length === 0 && (
              <div className="text-base text-slate-500">작업 공종이 없습니다.</div>
            )}
            {localAssessment.categories.map((category, index) => (
              <div key={category.id} className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-4">
                {/* 대분류 헤더 */}
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-2">
                    대분류{index + 1}
                  </label>
                  <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-base text-slate-800">
                    {category.categoryName || '-'}
                  </div>
                </div>

                {/* 소분류별 위험요인 */}
                {category.subcategories.map((subcategory, subIndex) => {
                  const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
                  const subcategoryFactors = subcategory.riskFactors;

                  return (
                    <div key={subcategory.id} className="bg-orange-50/30 rounded-lg p-4 ml-4 space-y-4">
                      {/* 소분류 헤더 */}
                      <h4 className="text-base font-bold text-slate-700">
                        소분류{circledNumbers[subIndex] || `${subIndex + 1}`} {subcategory.name}
                      </h4>

                      {/* 위험요인 카드들 */}
                      <div className="space-y-4">
                        {subcategoryFactors.map((factor) => {
                          const getLevelStyles = () => {
                            switch (factor.level) {
                              case 'HIGH':
                                return 'border-red-600 bg-red-50/50';
                              case 'MEDIUM':
                                return 'border-amber-600 bg-amber-50/50';
                              case 'LOW':
                                return 'border-green-600 bg-green-50/50';
                              default:
                                return 'border-gray-200 bg-white';
                            }
                          };

                          const levelLabel = factor.level === 'HIGH' ? '상' : factor.level === 'MEDIUM' ? '중' : factor.level === 'LOW' ? '하' : null;

                          return (
                            <div key={factor.id} className={`rounded-xl p-4 space-y-4 ${getLevelStyles()}`}>
                              {/* 위험 요인 */}
                              <div>
                                <label className="block text-base font-medium text-slate-600 mb-2">
                                  위험 요인
                                </label>
                                {canEdit ? (
                                  <input
                                    type="text"
                                    value={factor.factor}
                                    onChange={(e) =>
                                      setItems((prev) =>
                                        prev.map((item) =>
                                          item.id === factor.id
                                            ? { ...item, risk_factor_name: e.target.value }
                                            : item
                                        )
                                      )
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                  />
                                ) : (
                                  <div className="px-4 py-2 text-base text-slate-800">
                                    {factor.factor}
                                  </div>
                                )}
                              </div>

                              {/* 위험성 수준 */}
                              <div>
                                <div className="flex items-center gap-6">
                                  <span className="text-base font-medium text-slate-600">위험성 수준</span>
                                  {canEdit ? (
                                    <div className="flex items-center gap-4">
                                      {[
                                        { value: 'HIGH', label: '상' },
                                        { value: 'MEDIUM', label: '중' },
                                        { value: 'LOW', label: '하' },
                                      ].map((option) => (
                                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`risk-level-${factor.id}`}
                                            value={option.value}
                                            checked={factor.level === option.value}
                                            onChange={() => {
                                              setItems((prev) =>
                                                prev.map((item) =>
                                                  item.id === factor.id
                                                    ? { ...item, level: option.value as 'HIGH' | 'MEDIUM' | 'LOW' }
                                                    : item
                                                )
                                              );
                                            }}
                                            className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                                          />
                                          <span className="text-base text-slate-700">{option.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-base text-slate-700">{levelLabel || '-'}</span>
                                  )}
                                </div>
                              </div>

                              {/* 개선 대책 */}
                              <div>
                                <label className="block text-base font-medium text-slate-600 mb-2">
                                  개선 대책
                                </label>
                                {canEdit ? (
                                  <input
                                    type="text"
                                    value={factor.improvement}
                                    onChange={(e) =>
                                      setItems((prev) =>
                                        prev.map((item) =>
                                          item.id === factor.id
                                            ? { ...item, measures: e.target.value }
                                            : item
                                        )
                                      )
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                  />
                                ) : (
                                  <div className="px-4 py-2 text-base text-slate-700">
                                    {factor.improvement || '-'}
                                  </div>
                                )}
                              </div>

                              {/* 작업 기간 */}
                              <div>
                                <label className="block text-base font-medium text-slate-600 mb-2">
                                  작업 기간
                                </label>
                                <div className="flex items-center gap-3">
                                  <div className="relative flex-1">
                                    <input
                                      type="date"
                                      value={factor.workPeriodStart}
                                      disabled={!canEdit}
                                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-slate-500"
                                      readOnly
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                  </div>
                                  <span className="text-slate-500">~</span>
                                  <div className="relative flex-1">
                                    <input
                                      type="date"
                                      value={factor.workPeriodEnd}
                                      disabled={!canEdit}
                                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-slate-500"
                                      readOnly
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div>
              <label className="block text-base font-medium text-slate-600 mb-2">대분류</label>
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-base text-slate-800">
                {mergedAssessment?.category_name || '-'}
              </div>
            </div>
            {mergedAssessment?.subcategory_name && (
              <div className="mt-4">
                <label className="block text-base font-medium text-slate-600 mb-2">세부 공종</label>
                <div className="px-3 py-1.5 bg-orange-50 text-orange-700 text-base rounded-lg border border-orange-200 inline-block">
                  {mergedAssessment.subcategory_name}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ApprovalLineSelectModal
        isOpen={approvalModalOpen && canEdit}
        onClose={() => setApprovalModalOpen(false)}
        lines={availableApprovalLines}
        selectedId={selectedApprovalLine?.id || null}
        onSelect={handleApprovalLineSelect}
      />

      <ConfirmDialog
        isOpen={showLineChangeWarning}
        onClose={() => setShowLineChangeWarning(false)}
        onConfirm={confirmApprovalLineChange}
        title="결재라인 변경"
        message="기존 서명 정보는 저장되지 않으며 삭제됩니다. 계속하시겠습니까?"
        confirmText="변경"
        cancelText="취소"
        variant="warning"
      />
    </div>
  );
}



