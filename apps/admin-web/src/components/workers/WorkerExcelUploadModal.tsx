import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Trash2,
  RefreshCw,
  Send,
  Edit3,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Team } from '@tong-pass/shared';

interface WorkerExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
}

// 엑셀 행 데이터 타입
interface ExcelRow {
  rowNumber: number;
  name: string;
  phone: string;
  teamName: string;
  birthDate: string;
  role: string;
  position: string;
  gender: string;
  nationality: string;
  // 검증 상태
  isValid: boolean;
  errors: RowError[];
  // 중복 여부
  isDuplicate: boolean;
  duplicateAction?: 'update' | 'skip';
}

interface RowError {
  field: string;
  message: string;
}

// 업로드 단계
type UploadStep = 'upload' | 'preview' | 'complete';

export default function WorkerExcelUploadModal({ isOpen, onClose, teams }: WorkerExcelUploadModalProps) {
  const [step, setStep] = useState<UploadStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ExcelRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof ExcelRow } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 처리 (파싱 시뮬레이션)
  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setIsProcessing(true);

    // 실제로는 xlsx 라이브러리로 파싱해야 함
    // 여기서는 시뮬레이션용 Mock 데이터 생성
    setTimeout(() => {
      const mockParsedData: ExcelRow[] = [
        { rowNumber: 1, name: '홍길동', phone: '01012345678', teamName: 'A업체(전기팀)', birthDate: '19800101', role: '근로자', position: '전기기사', gender: '남성', nationality: '대한민국', isValid: true, errors: [], isDuplicate: false },
        { rowNumber: 2, name: '김철수', phone: '01023456789', teamName: 'A업체(전기팀)', birthDate: '19750515', role: '팀 관리자', position: '안전관리자', gender: '남성', nationality: '대한민국', isValid: true, errors: [], isDuplicate: true },
        { rowNumber: 3, name: '이영희', phone: '010111122', teamName: 'B업체(미장팀)', birthDate: '1985', role: '근로자', position: '미장공', gender: '여성', nationality: '대한민국', isValid: false, errors: [{ field: 'phone', message: '전화번호 형식 오류' }, { field: 'birthDate', message: '생년월일 8자리 필요' }], isDuplicate: false },
        { rowNumber: 4, name: '', phone: '01033334444', teamName: 'A업체(전기팀)', birthDate: '19900101', role: '근로자', position: '일반근로자', gender: '남성', nationality: '대한민국', isValid: false, errors: [{ field: 'name', message: '이름 필수' }], isDuplicate: false },
        { rowNumber: 5, name: '박민수', phone: '01044445555', teamName: 'D업체(존재안함)', birthDate: '19880720', role: '근로자', position: '설비기사', gender: '남성', nationality: '대한민국', isValid: false, errors: [{ field: 'teamName', message: '등록되지 않은 팀' }], isDuplicate: false },
        { rowNumber: 6, name: '최서연', phone: '01055556666', teamName: 'C업체(설비팀)', birthDate: '19950312', role: '근로자', position: '용접공', gender: '여성', nationality: '베트남', isValid: true, errors: [], isDuplicate: false },
        { rowNumber: 7, name: '정대호', phone: '01066667777', teamName: 'B업체(미장팀)', birthDate: '19580815', role: '근로자', position: '일반근로자', gender: '남성', nationality: '대한민국', isValid: true, errors: [], isDuplicate: false },
      ];

      setParsedRows(mockParsedData);
      setStep('preview');
      setIsProcessing(false);
    }, 1500);
  }, []);

  // 파일 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // 양식 다운로드
  const downloadTemplate = useCallback(() => {
    // 근로자 등록 양식 시트 생성
    const templateData = [
      ['성명', '휴대폰번호', '소속팀', '생년월일', '역할', '직종', '성별', '국적'],
      ['홍길동', '01012345678', '', '19850101', '근로자', '전기기사', '남성', '대한민국'],
      ['김영희', '01098765432', '', '19900515', '팀 관리자', '안전관리자', '여성', '대한민국'],
    ];

    // 팀 목록 시트 생성
    const teamListData = [
      ['등록된 소속팀 목록'],
      ['(아래 팀명을 복사하여 사용하세요)'],
      [''],
      ...teams.map(team => [team.name]),
    ];

    // 입력 안내 시트 생성
    const guideData = [
      ['컬럼명', '필수여부', '형식', '설명'],
      ['성명', '필수', '텍스트', '근로자 이름'],
      ['휴대폰번호', '필수', '숫자 11자리', '하이픈(-) 없이 입력 (예: 01012345678)'],
      ['소속팀', '필수', '텍스트', '시스템에 등록된 팀명과 정확히 일치해야 함'],
      ['생년월일', '필수', '숫자 8자리', '하이픈(-) 없이 입력 (예: 19850101)'],
      ['역할', '필수', '텍스트', '"근로자" 또는 "팀 관리자"'],
      ['직종', '선택', '텍스트', '직종/직책 (예: 전기기사, 용접공)'],
      ['성별', '선택', '텍스트', '"남성" 또는 "여성"'],
      ['국적', '선택', '텍스트', '국적 (기본값: 대한민국)'],
    ];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 시트 추가
    const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
    const teamSheet = XLSX.utils.aoa_to_sheet(teamListData);
    const guideSheet = XLSX.utils.aoa_to_sheet(guideData);

    // 열 너비 설정
    templateSheet['!cols'] = [
      { wch: 12 }, // 성명
      { wch: 15 }, // 휴대폰번호
      { wch: 20 }, // 소속팀
      { wch: 12 }, // 생년월일
      { wch: 12 }, // 역할
      { wch: 15 }, // 직종
      { wch: 8 },  // 성별
      { wch: 12 }, // 국적
    ];

    teamSheet['!cols'] = [{ wch: 30 }];
    guideSheet['!cols'] = [
      { wch: 15 },
      { wch: 10 },
      { wch: 20 },
      { wch: 40 },
    ];

    XLSX.utils.book_append_sheet(workbook, templateSheet, '근로자등록');
    XLSX.utils.book_append_sheet(workbook, teamSheet, '팀목록');
    XLSX.utils.book_append_sheet(workbook, guideSheet, '입력안내');

    // 파일 다운로드
    const fileName = `통패스_근로자등록_양식_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [teams]);

  // 셀 수정
  const handleCellEdit = (rowNumber: number, field: keyof ExcelRow, value: string) => {
    setParsedRows(prev => prev.map(row => {
      if (row.rowNumber === rowNumber) {
        return { ...row, [field]: value };
      }
      return row;
    }));
    setEditingCell(null);
  };

  // 행 삭제
  const removeRow = (rowNumber: number) => {
    setParsedRows(prev => prev.filter(row => row.rowNumber !== rowNumber));
  };

  // 재검증
  const revalidateRows = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setParsedRows(prev => prev.map(row => {
        const errors: RowError[] = [];

        // 이름 검증
        if (!row.name.trim()) {
          errors.push({ field: 'name', message: '이름 필수' });
        }

        // 전화번호 검증
        if (!/^[0-9]{10,11}$/.test(row.phone.replace(/-/g, ''))) {
          errors.push({ field: 'phone', message: '전화번호 형식 오류' });
        }

        // 생년월일 검증
        if (!/^[0-9]{8}$/.test(row.birthDate.replace(/-/g, ''))) {
          errors.push({ field: 'birthDate', message: '생년월일 8자리 필요' });
        }

        // 팀 검증
        const teamExists = teams.some(t => t.name === row.teamName);
        if (!teamExists) {
          errors.push({ field: 'teamName', message: '등록되지 않은 팀' });
        }

        return {
          ...row,
          isValid: errors.length === 0,
          errors,
        };
      }));
      setIsProcessing(false);
    }, 500);
  };

  // 중복 처리 설정
  const setDuplicateAction = (rowNumber: number, action: 'update' | 'skip') => {
    setParsedRows(prev => prev.map(row => {
      if (row.rowNumber === rowNumber) {
        return { ...row, duplicateAction: action };
      }
      return row;
    }));
  };

  // 최종 등록
  const handleSubmit = () => {
    // TODO: 실제 API 호출 시 validRows 사용
    // const validRows = parsedRows.filter(row => row.isValid && (!row.isDuplicate || row.duplicateAction));
    setIsProcessing(true);

    setTimeout(() => {
      setStep('complete');
      setIsProcessing(false);
    }, 1500);
  };

  // 통계
  const validCount = parsedRows.filter(r => r.isValid && !r.isDuplicate).length;
  const errorCount = parsedRows.filter(r => !r.isValid).length;
  const duplicateCount = parsedRows.filter(r => r.isDuplicate).length;
  const pendingDuplicates = parsedRows.filter(r => r.isDuplicate && !r.duplicateAction).length;

  // 모달 닫기 및 초기화
  const handleClose = useCallback(() => {
    setStep('upload');
    setFileName(null);
    setParsedRows([]);
    onClose();
  }, [onClose]);

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800">엑셀 일괄 등록</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {step === 'upload' && '엑셀 파일을 업로드하여 대량의 근로자를 한 번에 등록하세요'}
              {step === 'preview' && `${parsedRows.length}건 분석 완료 - 오류를 확인하고 수정하세요`}
              {step === 'complete' && '등록이 완료되었습니다'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* 양식 다운로드 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={24} className="text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-800">엑셀 양식 다운로드</p>
                    <p className="text-sm text-blue-600">시스템에 등록된 팀 목록이 포함된 양식입니다</p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  <Download size={16} />
                  다운로드
                </button>
              </div>

              {/* 드래그 앤 드롭 영역 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  isDragging
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
                }`}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={48} className="text-orange-500 animate-spin" />
                    <p className="text-slate-600 font-bold">파일 분석 중...</p>
                  </div>
                ) : (
                  <>
                    <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                    <p className="text-lg font-bold text-slate-700 mb-2">
                      엑셀 파일을 드래그하여 놓으세요
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      또는 클릭하여 파일 선택 (.xlsx, .xls)
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 rounded-xl font-bold text-white
                                 bg-gradient-to-r from-orange-500 to-orange-600
                                 hover:from-orange-600 hover:to-orange-700 transition-all"
                    >
                      파일 선택
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              {/* 컬럼 안내 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-bold text-slate-700 mb-3">필수 컬럼 안내</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-slate-600">성명 (필수)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-slate-600">휴대폰번호 (필수)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-slate-600">소속팀 (필수)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-slate-600">생년월일 (필수)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-slate-600">역할 (필수)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-300 rounded-full" />
                    <span className="text-slate-600">직종 (선택)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-300 rounded-full" />
                    <span className="text-slate-600">성별 (선택)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-300 rounded-full" />
                    <span className="text-slate-600">국적 (선택)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* 요약 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-black text-green-700">{validCount}</p>
                  <p className="text-sm text-green-600">정상</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <AlertCircle size={24} className="mx-auto text-red-600 mb-2" />
                  <p className="text-2xl font-black text-red-700">{errorCount}</p>
                  <p className="text-sm text-red-600">오류</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <RefreshCw size={24} className="mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-black text-yellow-700">{duplicateCount}</p>
                  <p className="text-sm text-yellow-600">중복</p>
                </div>
              </div>

              {/* 테이블 */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="font-bold text-slate-700">
                    파일: {fileName}
                  </p>
                  <button
                    onClick={revalidateRows}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
                    재검증
                  </button>
                </div>
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full min-w-[900px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-50 text-left border-b border-gray-200">
                        <th className="px-3 py-2 text-xs font-bold text-slate-500 w-12 bg-gray-50">#</th>
                        <th className="px-3 py-2 text-xs font-bold text-slate-500 bg-gray-50">상태</th>
                        <th className="px-3 py-2 text-xs font-bold text-slate-500 bg-gray-50">성명</th>
                        <th className="px-3 py-2 text-xs font-bold text-slate-500 bg-gray-50">휴대폰번호</th>
                        <th className="px-3 py-2 text-xs font-bold text-slate-500 bg-gray-50">소속팀</th>
                        <th className="px-3 py-2 text-xs font-bold text-slate-500 bg-gray-50">생년월일</th>
                        <th className="px-3 py-2 text-xs font-bold text-slate-500 bg-gray-50">역할</th>
                        <th className="px-3 py-2 text-xs font-bold text-slate-500 bg-gray-50">직종</th>
                        <th className="px-3 py-2 text-xs font-bold text-slate-500 w-20 bg-gray-50">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`border-b border-gray-100 ${
                            !row.isValid ? 'bg-red-50' : row.isDuplicate ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-sm text-slate-500">{row.rowNumber}</td>
                          <td className="px-3 py-2">
                            {!row.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-red-700 bg-red-100 rounded">
                                <AlertCircle size={12} />
                                오류
                              </span>
                            ) : row.isDuplicate ? (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-yellow-700 bg-yellow-100 rounded">
                                  중복
                                </span>
                                {!row.duplicateAction && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setDuplicateAction(row.rowNumber, 'update')}
                                      className="px-1.5 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                    >
                                      업데이트
                                    </button>
                                    <button
                                      onClick={() => setDuplicateAction(row.rowNumber, 'skip')}
                                      className="px-1.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                    >
                                      건너뛰기
                                    </button>
                                  </div>
                                )}
                                {row.duplicateAction && (
                                  <span className="text-xs text-slate-500">
                                    ({row.duplicateAction === 'update' ? '업데이트' : '건너뜀'})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-green-700 bg-green-100 rounded">
                                <CheckCircle size={12} />
                                정상
                              </span>
                            )}
                          </td>
                          <EditableCell
                            value={row.name}
                            hasError={row.errors.some(e => e.field === 'name')}
                            errorMessage={row.errors.find(e => e.field === 'name')?.message}
                            isEditing={editingCell?.row === row.rowNumber && editingCell?.field === 'name'}
                            onEdit={() => setEditingCell({ row: row.rowNumber, field: 'name' })}
                            onSave={(value) => handleCellEdit(row.rowNumber, 'name', value)}
                          />
                          <EditableCell
                            value={row.phone}
                            hasError={row.errors.some(e => e.field === 'phone')}
                            errorMessage={row.errors.find(e => e.field === 'phone')?.message}
                            isEditing={editingCell?.row === row.rowNumber && editingCell?.field === 'phone'}
                            onEdit={() => setEditingCell({ row: row.rowNumber, field: 'phone' })}
                            onSave={(value) => handleCellEdit(row.rowNumber, 'phone', value)}
                          />
                          <TeamSelectCell
                            value={row.teamName}
                            hasError={row.errors.some(e => e.field === 'teamName')}
                            errorMessage={row.errors.find(e => e.field === 'teamName')?.message}
                            isEditing={editingCell?.row === row.rowNumber && editingCell?.field === 'teamName'}
                            onEdit={() => setEditingCell({ row: row.rowNumber, field: 'teamName' })}
                            onSave={(value) => handleCellEdit(row.rowNumber, 'teamName', value)}
                            teams={teams}
                          />
                          <EditableCell
                            value={row.birthDate}
                            hasError={row.errors.some(e => e.field === 'birthDate')}
                            errorMessage={row.errors.find(e => e.field === 'birthDate')?.message}
                            isEditing={editingCell?.row === row.rowNumber && editingCell?.field === 'birthDate'}
                            onEdit={() => setEditingCell({ row: row.rowNumber, field: 'birthDate' })}
                            onSave={(value) => handleCellEdit(row.rowNumber, 'birthDate', value)}
                          />
                          <td className="px-3 py-2 text-sm text-slate-700">{row.role}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{row.position || '-'}</td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeRow(row.rowNumber)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">등록 완료!</h3>
              <p className="text-slate-500 mb-6">
                총 {validCount}명의 근로자가 등록되었습니다.<br />
                동의 링크가 문자로 발송됩니다.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">신규 등록</span>
                  <span className="font-bold text-slate-700">{validCount}명</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">정보 업데이트</span>
                  <span className="font-bold text-slate-700">
                    {parsedRows.filter(r => r.duplicateAction === 'update').length}명
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">건너뜀 (오류/중복)</span>
                  <span className="font-bold text-slate-700">
                    {errorCount + parsedRows.filter(r => r.duplicateAction === 'skip').length}건
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="px-8 py-3 rounded-xl font-bold text-white
                           bg-gradient-to-r from-orange-500 to-orange-600
                           hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                확인
              </button>
            </div>
          )}
        </div>

        {/* Footer - Preview Step Only */}
        {step === 'preview' && (
          <div className="shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {pendingDuplicates > 0 && (
                <span className="text-yellow-600 font-medium">
                  중복 {pendingDuplicates}건의 처리 방식을 선택해주세요
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('upload');
                  setParsedRows([]);
                  setFileName(null);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                다시 업로드
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing || validCount === 0 || pendingDuplicates > 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white
                           bg-gradient-to-r from-orange-500 to-orange-600
                           hover:from-orange-600 hover:to-orange-700 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {validCount}명 등록 및 초대 발송
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 편집 가능한 셀 컴포넌트
function EditableCell({
  value,
  hasError,
  errorMessage,
  isEditing,
  onEdit,
  onSave,
}: {
  value: string;
  hasError: boolean;
  errorMessage?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
}) {
  const [editValue, setEditValue] = useState(value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue);
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onSave(value);
    }
  };

  if (isEditing) {
    return (
      <td className="px-3 py-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onSave(editValue)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full px-2 py-1 text-sm border border-orange-400 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </td>
    );
  }

  return (
    <td
      className={`px-3 py-2 cursor-pointer group ${hasError ? 'bg-red-100' : ''}`}
      onClick={onEdit}
      title={errorMessage}
    >
      <div className="flex items-center gap-1">
        <span className={`text-sm ${hasError ? 'text-red-700 font-medium' : 'text-slate-700'}`}>
          {value || '-'}
        </span>
        <Edit3 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {hasError && errorMessage && (
        <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
      )}
    </td>
  );
}

// 팀 선택 셀 컴포넌트 (드롭다운)
function TeamSelectCell({
  value,
  hasError,
  errorMessage,
  isEditing,
  onEdit,
  onSave,
  teams,
}: {
  value: string;
  hasError: boolean;
  errorMessage?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  teams: Team[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 필터링된 팀 목록
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 팀 선택 핸들러
  const handleSelectTeam = (teamName: string) => {
    onSave(teamName);
    setIsOpen(false);
    setSearchTerm('');
  };

  if (isEditing || isOpen) {
    return (
      <td className="px-3 py-2 relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="팀 검색..."
            autoFocus
            className="w-full px-2 py-1 text-sm border border-orange-400 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
              {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSelectTeam(team.name)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 transition-colors flex items-center justify-between"
                  >
                    <span className="text-slate-700">{team.name}</span>
                    {team.name === value && (
                      <CheckCircle size={14} className="text-green-500" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500">
                  일치하는 팀이 없습니다
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    );
  }

  return (
    <td
      className={`px-3 py-2 cursor-pointer group ${hasError ? 'bg-red-100' : ''}`}
      onClick={() => {
        onEdit();
        setIsOpen(true);
      }}
      title={errorMessage}
    >
      <div className="flex items-center gap-1">
        <span className={`text-sm ${hasError ? 'text-red-700 font-medium' : 'text-slate-700'}`}>
          {value || '-'}
        </span>
        <Edit3 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {hasError && errorMessage && (
        <p className="text-xs text-red-600 mt-0.5">
          {errorMessage} <span className="text-orange-600 font-medium">- 클릭하여 선택</span>
        </p>
      )}
    </td>
  );
}
