/**
 * 수시 위험성평가 위험요인 입력 카드
 *
 * 공통 필드 + 방식별 위험성 입력 + 조치 필드
 */

import { useState } from 'react';
import { Trash2, Calendar, Users, Plus, X } from 'lucide-react';
import ActionAssigneeSelectModal from '../../modals/ActionAssigneeSelectModal';
import { getUsersByIds } from '@/mocks/users';
import type { RiskMethod, OccasionalRiskFactor } from '../../types/occasional';

interface Props {
  index: number;
  factor: OccasionalRiskFactor;
  riskMethod: RiskMethod;
  onChange: (factor: OccasionalRiskFactor) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export default function OccasionalRiskFactorCard({
  index,
  factor,
  riskMethod,
  onChange,
  onRemove,
  disabled = false,
}: Props) {
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [confirmerModalOpen, setConfirmerModalOpen] = useState(false);
  const [newReviewComment, setNewReviewComment] = useState('');

  const assignees = getUsersByIds(factor.actionAssigneeIds);
  const confirmers = getUsersByIds(factor.actionConfirmerIds);

  // 공통 필드 업데이트
  const updateField = <K extends keyof OccasionalRiskFactor>(
    key: K,
    value: OccasionalRiskFactor[K]
  ) => {
    onChange({ ...factor, [key]: value });
  };

  // LEVEL 방식 필드 업데이트
  const updateLevel = (level: 'HIGH' | 'MEDIUM' | 'LOW' | null) => {
    if ('level' in factor) {
      onChange({ ...factor, level });
    }
  };

  // FREQUENCY_INTENSITY 방식 필드 업데이트
  const updateFrequencyIntensity = (
    frequency: number | null,
    intensity: number | null
  ) => {
    if ('frequency' in factor && 'intensity' in factor) {
      const riskScore =
        frequency !== null && intensity !== null ? frequency * intensity : null;
      const gradeLevel = riskScore !== null ? calculateGradeLevel(riskScore) : null;

      onChange({
        ...factor,
        frequency,
        intensity,
        riskScore,
        gradeLevel,
      });
    }
  };

  // 등급 계산
  const calculateGradeLevel = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (score >= 15) return 'HIGH';
    if (score >= 6) return 'MEDIUM';
    return 'LOW';
  };

  // 검토내용 추가
  const handleAddReviewComment = () => {
    if (!newReviewComment.trim()) return;

    const currentComments = factor.reviewComments || [];
    onChange({
      ...factor,
      reviewComments: [...currentComments, newReviewComment.trim()],
    });
    setNewReviewComment('');
  };

  // 검토내용 삭제
  const handleDeleteReviewComment = (index: number) => {
    const currentComments = factor.reviewComments || [];
    onChange({
      ...factor,
      reviewComments: currentComments.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <div className="p-6 rounded-xl border-2 border-gray-200 bg-white space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-700">
            위험요인 #{index + 1}
          </h4>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="삭제"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* 위험요인 */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            위험요인 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={factor.factor}
            onChange={(e) => updateField('factor', e.target.value)}
            disabled={disabled}
            placeholder="예: 높은 곳에서의 추락"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
          />
        </div>

        {/* 개선대책 */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            개선대책 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={factor.improvement}
            onChange={(e) => updateField('improvement', e.target.value)}
            disabled={disabled}
            placeholder="예: 안전난간 설치, 안전대 착용 의무화"
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none disabled:bg-gray-50"
          />
        </div>

        {/* 작업 기간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              작업 시작일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={factor.workPeriodStart}
              onChange={(e) => updateField('workPeriodStart', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              작업 종료일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={factor.workPeriodEnd}
              onChange={(e) => updateField('workPeriodEnd', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* 방식별 위험성 입력 */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <h5 className="text-sm font-bold text-slate-700 mb-3">
            위험성 평가 <span className="text-red-500">*</span>
          </h5>

          {riskMethod === 'LEVEL' && 'level' in factor && (
            <div className="flex gap-3">
              {(['HIGH', 'MEDIUM', 'LOW'] as const).map((level) => (
                <label
                  key={level}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all
                    ${
                      factor.level === level
                        ? level === 'HIGH'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : level === 'MEDIUM'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-slate-600 hover:border-slate-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={`level-${factor.id}`}
                    value={level}
                    checked={factor.level === level}
                    onChange={() => updateLevel(level)}
                    disabled={disabled}
                    className="hidden"
                  />
                  <span className="font-bold">
                    {level === 'HIGH' ? '상' : level === 'MEDIUM' ? '중' : '하'}
                  </span>
                </label>
              ))}
            </div>
          )}

          {riskMethod === 'FREQUENCY_INTENSITY' && 'frequency' in factor && (
            <div className="space-y-3">
              {/* 빈도 */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  빈도 (1~4)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((freq) => (
                    <label
                      key={freq}
                      className={`
                        flex items-center justify-center px-3 py-2 rounded-lg border-2 cursor-pointer transition-all
                        ${
                          factor.frequency === freq
                            ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                            : 'border-gray-200 bg-white text-slate-600 hover:border-orange-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name={`frequency-${factor.id}`}
                        value={freq}
                        checked={factor.frequency === freq}
                        onChange={() =>
                          updateFrequencyIntensity(freq, factor.intensity)
                        }
                        disabled={disabled}
                        className="hidden"
                      />
                      {freq}
                    </label>
                  ))}
                </div>
              </div>

              {/* 강도 */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  강도 (1~5)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((intens) => (
                    <label
                      key={intens}
                      className={`
                        flex items-center justify-center px-3 py-2 rounded-lg border-2 cursor-pointer transition-all
                        ${
                          factor.intensity === intens
                            ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                            : 'border-gray-200 bg-white text-slate-600 hover:border-orange-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name={`intensity-${factor.id}`}
                        value={intens}
                        checked={factor.intensity === intens}
                        onChange={() =>
                          updateFrequencyIntensity(factor.frequency, intens)
                        }
                        disabled={disabled}
                        className="hidden"
                      />
                      {intens}
                    </label>
                  ))}
                </div>
              </div>

              {/* 결과 표시 */}
              {factor.riskScore !== null && factor.gradeLevel !== null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200">
                  <div className="text-sm text-slate-600">
                    위험성 점수: <span className="font-bold text-slate-800">{factor.riskScore}</span>점
                  </div>
                  <div className="h-4 w-px bg-slate-300" />
                  <div className="text-sm">
                    등급:{' '}
                    <span
                      className={`font-bold ${
                        factor.gradeLevel === 'HIGH'
                          ? 'text-red-600'
                          : factor.gradeLevel === 'MEDIUM'
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {factor.gradeLevel === 'HIGH' ? '상' : factor.gradeLevel === 'MEDIUM' ? '중' : '하'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 조치일 */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Calendar size={16} className="inline mr-1" />
            조치일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={factor.actionDate}
            onChange={(e) => updateField('actionDate', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
          />
        </div>

        {/* 조치자 */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Users size={16} className="inline mr-1" />
            조치자 <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setAssigneeModalOpen(true)}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-left hover:border-orange-300 hover:bg-orange-50/50 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {assignees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignees.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700"
                  >
                    {user.name} ({user.position})
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-400">조치자를 선택해주세요</span>
            )}
          </button>
        </div>

        {/* 조치확인자 */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Users size={16} className="inline mr-1" />
            조치확인자 <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setConfirmerModalOpen(true)}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-left hover:border-orange-300 hover:bg-orange-50/50 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {confirmers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {confirmers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700"
                  >
                    {user.name} ({user.position})
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-400">조치확인자를 선택해주세요</span>
            )}
          </button>
        </div>

        {/* 검토내용 */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            검토내용
          </label>

          {/* 기존 검토내용 목록 */}
          {factor.reviewComments && factor.reviewComments.length > 0 && (
            <div className="space-y-2 mb-3">
              {factor.reviewComments.map((comment, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <span className="text-sm text-slate-700 flex-1">{comment}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteReviewComment(idx)}
                    disabled={disabled}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="삭제"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 새 검토내용 입력 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newReviewComment}
              onChange={(e) => setNewReviewComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddReviewComment();
                }
              }}
              disabled={disabled}
              placeholder="검토내용을 입력하세요 (Enter로 추가)"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
            />
            <button
              type="button"
              onClick={handleAddReviewComment}
              disabled={disabled || !newReviewComment.trim()}
              className="px-4 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus size={16} />
              추가
            </button>
          </div>
        </div>
      </div>

      {/* 조치자 선택 모달 */}
      <ActionAssigneeSelectModal
        isOpen={assigneeModalOpen}
        title="조치자 선택"
        selectedIds={factor.actionAssigneeIds}
        onConfirm={(ids) => updateField('actionAssigneeIds', ids)}
        onClose={() => setAssigneeModalOpen(false)}
      />

      {/* 조치확인자 선택 모달 */}
      <ActionAssigneeSelectModal
        isOpen={confirmerModalOpen}
        title="조치확인자 선택"
        selectedIds={factor.actionConfirmerIds}
        onConfirm={(ids) => updateField('actionConfirmerIds', ids)}
        onClose={() => setConfirmerModalOpen(false)}
      />
    </>
  );
}
