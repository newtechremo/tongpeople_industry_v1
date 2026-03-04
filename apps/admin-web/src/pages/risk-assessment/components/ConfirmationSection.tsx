/**
 * 수시 위험성평가 문서 확인자 섹션
 *
 * 기능:
 * - 일자별 확인자 조회 및 출력
 * - 작업기간 최종 확인자 조회 및 출력
 * - 수시(OCCASIONAL) 타입에만 표시
 */

import { useState, useEffect } from 'react';
import { Calendar, Users, Download } from 'lucide-react';
import { getDailyConfirmations, getFinalConfirmers } from '@/api/confirmationApi';
import type {
  AssessmentConfirmationEvent,
  FinalConfirmer,
} from '@/components/risk-assessment/types/confirmation';
import DailyConfirmationPrint from './DailyConfirmationPrint';
import FinalConfirmationPrint from './FinalConfirmationPrint';

interface Props {
  assessmentId: string;
  assessmentTitle?: string; // 문서명 (출력용)
  siteName?: string; // 현장명 (출력용)
  workPeriodStart: string; // YYYY-MM-DD
  workPeriodEnd: string; // YYYY-MM-DD
}

type TabType = 'daily' | 'final';

export default function ConfirmationSection({
  assessmentId,
  assessmentTitle = '수시 위험성평가',
  siteName = '미지정 현장',
  workPeriodStart,
  workPeriodEnd,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // 기본값: 오늘 날짜 (YYYY-MM-DD)
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dailyConfirmations, setDailyConfirmations] = useState<AssessmentConfirmationEvent[]>([]);
  const [finalConfirmers, setFinalConfirmers] = useState<FinalConfirmer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDailyPrint, setShowDailyPrint] = useState(false);
  const [showFinalPrint, setShowFinalPrint] = useState(false);

  // 일자별 확인자 조회
  useEffect(() => {
    if (activeTab !== 'daily') return;

    const fetchDaily = async () => {
      setLoading(true);
      try {
        const result = await getDailyConfirmations(assessmentId, selectedDate);
        setDailyConfirmations(result.confirmations);
      } catch (error) {
        console.error('일자별 확인자 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDaily();
  }, [assessmentId, selectedDate, activeTab]);

  // 작업기간 최종 확인자 조회
  useEffect(() => {
    if (activeTab !== 'final') return;

    const fetchFinal = async () => {
      setLoading(true);
      try {
        const result = await getFinalConfirmers(assessmentId, workPeriodStart, workPeriodEnd);
        setFinalConfirmers(result.confirmers);
      } catch (error) {
        console.error('최종 확인자 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinal();
  }, [assessmentId, workPeriodStart, workPeriodEnd, activeTab]);

  // 일자별 출력
  const handleDailyPrint = () => {
    setShowDailyPrint(true);
  };

  // 최종 리스트 출력
  const handleFinalPrint = () => {
    setShowFinalPrint(true);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* 섹션 제목 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-700">문서 확인자</h3>
      </div>

      {/* 탭 버튼 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`
            px-4 py-2 font-bold text-sm transition-all border-b-2
            ${
              activeTab === 'daily'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>일자별 확인자</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('final')}
          className={`
            px-4 py-2 font-bold text-sm transition-all border-b-2
            ${
              activeTab === 'final'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>작업기간 최종 확인자</span>
          </div>
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'daily' ? (
        <div className="space-y-4">
          {/* 날짜 선택 */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-slate-600">조회 날짜:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 리스트 테이블 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600">
                    소속
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600">
                    확인시각
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600">
                    출처
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      조회 중...
                    </td>
                  </tr>
                ) : dailyConfirmations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      해당 날짜에 확인한 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  dailyConfirmations.map((confirmation) => (
                    <tr key={confirmation.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                        {confirmation.confirmedByUserName}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {confirmation.confirmedByDepartment || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(confirmation.confirmedAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span
                          className={`
                          px-2 py-1 rounded text-xs font-bold
                          ${
                            confirmation.source === 'PC'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }
                        `}
                        >
                          {confirmation.source}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 일자별 출력 버튼 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDailyPrint}
              disabled={dailyConfirmations.length === 0}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm
                text-white bg-gradient-to-r from-orange-500 to-orange-600
                hover:from-orange-600 hover:to-orange-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              "
            >
              <Download className="w-4 h-4" />
              <span>일자별 출력</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 작업기간 표시 */}
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-gray-50 p-3 rounded-lg">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">작업기간:</span>
            <span>
              {workPeriodStart} ~ {workPeriodEnd}
            </span>
          </div>

          {/* 최종 확인자 테이블 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600">
                    소속
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600">
                    최초 확인일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600">
                    최종 확인일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600">
                    확인 횟수
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      조회 중...
                    </td>
                  </tr>
                ) : finalConfirmers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      작업기간 동안 확인한 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  finalConfirmers.map((confirmer) => (
                    <tr key={confirmer.userId} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                        {confirmer.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {confirmer.department || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {confirmer.firstConfirmedDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {confirmer.lastConfirmedDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold">
                          {confirmer.confirmedCount}회
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 최종 리스트 출력 버튼 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFinalPrint}
              disabled={finalConfirmers.length === 0}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm
                text-white bg-gradient-to-r from-orange-500 to-orange-600
                hover:from-orange-600 hover:to-orange-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              "
            >
              <Download className="w-4 h-4" />
              <span>최종 리스트 출력</span>
            </button>
          </div>
        </div>
      )}

      {/* 인쇄용 컴포넌트 */}
      {showDailyPrint && (
        <DailyConfirmationPrint
          documentName={assessmentTitle}
          siteName={siteName}
          date={selectedDate}
          confirmations={dailyConfirmations}
          onClose={() => setShowDailyPrint(false)}
        />
      )}
      {showFinalPrint && (
        <FinalConfirmationPrint
          documentName={assessmentTitle}
          siteName={siteName}
          workPeriodStart={workPeriodStart}
          workPeriodEnd={workPeriodEnd}
          confirmers={finalConfirmers}
          onClose={() => setShowFinalPrint(false)}
        />
      )}
    </div>
  );
}
