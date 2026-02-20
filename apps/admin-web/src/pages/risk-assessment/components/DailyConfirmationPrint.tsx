/**
 * 일자별 확인자 인쇄용 컴포넌트
 *
 * window.print()로 브라우저 인쇄 기능 활용
 */

import { useRef, useEffect } from 'react';
import type { AssessmentConfirmationEvent } from '@/components/risk-assessment/types/confirmation';

interface Props {
  documentName: string; // 문서명
  siteName: string; // 현장명
  date: string; // 조회일자 (YYYY-MM-DD)
  confirmations: AssessmentConfirmationEvent[];
  onClose: () => void;
}

export default function DailyConfirmationPrint({
  documentName,
  siteName,
  date,
  confirmations,
  onClose,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 컴포넌트 마운트 후 약간의 딜레이를 두고 인쇄 다이얼로그 표시
    const timer = setTimeout(() => {
      window.print();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 인쇄 후 닫기 (인쇄 다이얼로그가 닫힐 때)
  useEffect(() => {
    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [onClose]);

  const now = new Date();
  const printTime = now.toLocaleString('ko-KR');

  return (
    <div className="fixed inset-0 z-[9999] bg-white print:relative print:z-auto">
      <div ref={printRef} className="p-12 print:p-0">
        {/* 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-800 mb-2">
            수시 위험성평가 확인자 (일자별)
          </h1>
          <p className="text-lg text-slate-600">Daily Confirmation List</p>
        </div>

        {/* 문서 정보 */}
        <div className="mb-8 border border-gray-300 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 px-4 py-3 text-left text-sm font-bold text-slate-700 w-32">
                  문서명
                </th>
                <td className="px-4 py-3 text-sm text-slate-700">{documentName}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 px-4 py-3 text-left text-sm font-bold text-slate-700">
                  현장명
                </th>
                <td className="px-4 py-3 text-sm text-slate-700">{siteName}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 px-4 py-3 text-left text-sm font-bold text-slate-700">
                  조회일자
                </th>
                <td className="px-4 py-3 text-sm text-slate-700">{date}</td>
              </tr>
              <tr>
                <th className="bg-gray-100 px-4 py-3 text-left text-sm font-bold text-slate-700">
                  확인자 수
                </th>
                <td className="px-4 py-3 text-sm text-slate-700">{confirmations.length}명</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 확인자 목록 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-700 mb-4">확인자 목록</h2>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 border-r border-gray-200">
                    번호
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 border-r border-gray-200">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 border-r border-gray-200">
                    소속
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 border-r border-gray-200">
                    확인시각
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">출처</th>
                </tr>
              </thead>
              <tbody>
                {confirmations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500 border-t border-gray-200"
                    >
                      확인자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  confirmations.map((confirmation, index) => (
                    <tr key={confirmation.id} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm text-slate-700 border-r border-gray-200">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-r border-gray-200">
                        {confirmation.confirmedByUserName}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 border-r border-gray-200">
                        {confirmation.confirmedByDepartment || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 border-r border-gray-200">
                        {new Date(confirmation.confirmedAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {confirmation.source}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 출력 정보 */}
        <div className="text-right text-sm text-slate-500">
          <p>출력시각: {printTime}</p>
        </div>

        {/* 화면에만 표시되는 닫기 버튼 */}
        <div className="mt-8 text-center print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style>{`
        @media print {
          @page {
            margin: 2cm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:relative {
            position: relative !important;
          }

          .print\\:z-auto {
            z-index: auto !important;
          }

          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
