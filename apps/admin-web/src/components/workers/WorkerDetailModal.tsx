import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Crown,
  Phone,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  Heart,
  Users,
  Trash2,
  Briefcase,
  Flag,
  User,
  Edit2,
  Download,
  Check,
  Upload,
  RefreshCw,
} from 'lucide-react';
import type { Worker, EmergencyContact, HealthInfo, WorkerDocument, DocumentType } from '@tong-pass/shared';

interface WorkerDetailModalProps {
  worker: Worker | null;
  onClose: () => void;
}

// Mock 비상연락처
const mockEmergencyContact: EmergencyContact = {
  workerId: 'w1',
  name: '김영미',
  phone: '010-9999-8888',
  relationship: '배우자',
};

// Mock 건강정보
const mockHealthInfo: HealthInfo = {
  workerId: 'w1',
  bloodType: 'A+',
  smokingPerDay: 10,
  drinkingPerWeek: 2,
  drinkingAmount: '소주 1병',
  bloodPressureHigh: 130,
  bloodPressureLow: 85,
  hasChronicDisease: false,
};

// Mock 서류
const mockDocuments: WorkerDocument[] = [
  { id: 1, workerId: 'w1', type: 'SAFETY_PLEDGE', name: '안전관리서약서.pdf', url: '#', uploadedAt: '2024-01-15' },
  { id: 2, workerId: 'w1', type: 'PRIVACY_CONSENT', name: '개인정보동의서.pdf', url: '#', uploadedAt: '2024-01-15' },
  { id: 3, workerId: 'w1', type: 'SAFETY_EDUCATION_CERT', name: '기초안전교육증.jpg', url: '#', uploadedAt: '2024-01-20' },
  { id: 4, workerId: 'w1', type: 'TRAINING_CERT', name: '교육이수확인서.pdf', url: '#', uploadedAt: '2024-01-20' },
  { id: 5, workerId: 'w1', type: 'HEALTH_QUESTIONNAIRE', name: '건강문진표.pdf', url: '#', uploadedAt: '2024-01-22' },
  { id: 6, workerId: 'w1', type: 'LICENSE', name: '전기기사자격증.jpg', url: '#', uploadedAt: '2024-02-01' },
];

// 혈액형 옵션
const BLOOD_TYPE_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '모름'];

export default function WorkerDetailModal({ worker, onClose }: WorkerDetailModalProps) {
  // 수정 모드 상태
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showRoleChange, setShowRoleChange] = useState(false);

  // 기본정보 수정 상태
  const [editName, setEditName] = useState(worker?.name || '');
  const [editBirthDate, setEditBirthDate] = useState(worker?.birthDate || '');
  const [editPosition, setEditPosition] = useState(worker?.position || '');
  const [editNationality, setEditNationality] = useState(worker?.nationality || '대한민국');

  // 비상연락처 수정 상태
  const [editEmergencyName, setEditEmergencyName] = useState(mockEmergencyContact.name);
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(mockEmergencyContact.phone);
  const [editEmergencyRelation, setEditEmergencyRelation] = useState(mockEmergencyContact.relationship);

  // 건강정보 수정 상태
  const [editBloodType, setEditBloodType] = useState(mockHealthInfo.bloodType || '');

  // 서류 목록 상태
  const [documents, setDocuments] = useState(mockDocuments);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!worker) return null;

  // 직책 변경 핸들러
  const handleRoleToggle = () => {
    const newRole = worker.role === 'TEAM_ADMIN' ? 'WORKER' : 'TEAM_ADMIN';
    const message = newRole === 'TEAM_ADMIN'
      ? `${worker.name} 님을 팀장으로 변경합니다.\n\n[권한 안내]\n• 팀원들의 출퇴근 QR 스캔 권한이 부여됩니다.\n• 모바일 앱에서 팀원 관리가 가능합니다.`
      : `${worker.name} 님을 일반 팀원으로 변경합니다.\n\n[권한 안내]\n• QR 스캔 권한이 제거됩니다.\n• 본인 출퇴근만 가능합니다.`;

    if (confirm(message)) {
      alert(`${worker.name} 님의 직책이 ${newRole === 'TEAM_ADMIN' ? '팀장' : '팀원'}으로 변경되었습니다.`);
      setShowRoleChange(false);
    }
  };

  // 상태 배지
  const renderStatusBadge = () => {
    if (worker.status === 'PENDING') {
      return (
        <span className="px-2 py-0.5 text-xs font-bold text-yellow-700 bg-yellow-100 rounded">
          승인대기
        </span>
      );
    }
    if (worker.status === 'INACTIVE') {
      return (
        <span className="px-2 py-0.5 text-xs font-bold text-red-700 bg-red-100 rounded">
          비활성
        </span>
      );
    }
    return null;
  };

  // 기본정보 저장
  const handleSaveBasicInfo = () => {
    alert(`기본정보가 저장되었습니다.\n이름: ${editName}\n생년월일: ${editBirthDate}\n직종: ${editPosition}\n국적: ${editNationality}`);
    setEditingSection(null);
  };

  // 비상연락처 저장
  const handleSaveEmergency = () => {
    alert(`비상연락처가 저장되었습니다.\n${editEmergencyRelation}: ${editEmergencyName} (${editEmergencyPhone})`);
    setEditingSection(null);
  };

  // 서류 삭제
  const handleDeleteDocument = (doc: WorkerDocument) => {
    if (confirm(`"${doc.name}" 파일을 삭제하시겠습니까?\n\n삭제된 파일은 복구할 수 없습니다.`)) {
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      alert(`${doc.name} 파일이 삭제되었습니다.`);
    }
  };

  // 전체 다운로드 (ZIP)
  const handleDownloadAll = () => {
    alert(`${documents.length}개 파일을 ZIP으로 압축하여 다운로드합니다.\n\n${worker.name}_채용서류.zip`);
  };

  // 파일 업로드
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: WorkerDocument[] = Array.from(files).map((file, idx) => ({
      id: Date.now() + idx,
      workerId: worker.id,
      type: 'OTHER' as DocumentType,
      name: file.name,
      url: '#',
      uploadedAt: new Date().toISOString().split('T')[0],
    }));

    setDocuments(prev => [...prev, ...newDocs]);
    alert(`${files.length}개 파일이 업로드되었습니다.`);

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0">
                <User size={28} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {worker.role === 'TEAM_ADMIN' && (
                    <Crown size={18} className="text-yellow-500" />
                  )}
                  <h2 className="text-lg font-black text-slate-800">
                    {worker.name}
                  </h2>
                  <span className="text-slate-500">(만 {worker.age}세)</span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {worker.teamName} · {worker.position || '직종 미지정'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {/* 직책 배지 + 변경 버튼 */}
                  {worker.role !== 'SITE_ADMIN' && (
                    <div className="relative">
                      <button
                        onClick={() => setShowRoleChange(!showRoleChange)}
                        className={`flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                          worker.role === 'TEAM_ADMIN'
                            ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                            : 'text-slate-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {worker.role === 'TEAM_ADMIN' ? (
                          <>
                            <Crown size={12} />
                            팀장
                          </>
                        ) : (
                          '팀원'
                        )}
                        <RefreshCw size={10} className="ml-0.5" />
                      </button>
                      {/* 직책 변경 드롭다운 */}
                      {showRoleChange && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2">
                          <p className="text-xs text-slate-500 mb-2 px-2">직책 변경</p>
                          <button
                            onClick={handleRoleToggle}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-left rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            {worker.role === 'TEAM_ADMIN' ? (
                              <>
                                <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">👤</span>
                                팀원으로 변경
                              </>
                            ) : (
                              <>
                                <Crown size={16} className="text-blue-500" />
                                팀장으로 승격
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {worker.role === 'SITE_ADMIN' && (
                    <span className="px-2 py-0.5 text-xs font-bold text-yellow-700 bg-yellow-100 rounded">
                      현장 관리자
                    </span>
                  )}
                  {worker.isRepresentative && (
                    <span className="px-2 py-0.5 text-xs font-bold text-purple-700 bg-purple-100 rounded">
                      근로자 대표
                    </span>
                  )}
                  {worker.isSenior && (
                    <span className="px-2 py-0.5 text-xs font-bold text-orange-700 bg-orange-100 rounded">
                      고령자
                    </span>
                  )}
                  {renderStatusBadge()}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 고령 근로자 경고 */}
          {worker.isSenior && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertTriangle size={16} />
                <span className="font-bold text-sm">고령 근로자 - 안전 관리 주의 필요</span>
              </div>
            </div>
          )}

          {/* Single Column Layout */}
          <div className="space-y-5">
            {/* 기본 정보 */}
            <Section
              title="기본 정보"
              icon={<Building2 size={16} />}
              onEdit={() => {
                setEditName(worker.name);
                setEditBirthDate(worker.birthDate);
                setEditPosition(worker.position || '');
                setEditNationality(worker.nationality || '대한민국');
                setEditingSection('basic');
              }}
              isEditing={editingSection === 'basic'}
            >
              {editingSection === 'basic' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">이름</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      연락처 <span className="text-slate-400">(ID로 사용되어 변경 불가)</span>
                    </label>
                    <input
                      type="text"
                      value={worker.phone}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">생년월일</label>
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">직종</label>
                    <input
                      type="text"
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                      placeholder="예: 전기기사, 용접공"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">국적</label>
                    <input
                      type="text"
                      value={editNationality}
                      onChange={(e) => setEditNationality(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="flex-1 py-2 rounded-lg font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveBasicInfo}
                      className="flex-1 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-1"
                    >
                      <Check size={16} />
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <InfoRow icon={<Users size={14} />} label="팀(업체)" value={worker.teamName || '-'} />
                  <InfoRow icon={<Briefcase size={14} />} label="직종" value={worker.position || '-'} />
                  <InfoRow
                    icon={<Phone size={14} />}
                    label="연락처"
                    value={
                      <a href={`tel:${worker.phone}`} className="text-orange-600 hover:underline">
                        {worker.phone}
                      </a>
                    }
                  />
                  <InfoRow icon={<Calendar size={14} />} label="생년월일" value={`${worker.birthDate} (${worker.age}세)`} />
                  <InfoRow icon={<Flag size={14} />} label="국적" value={worker.nationality || '대한민국'} />
                  <InfoRow icon={<Calendar size={14} />} label="등록일" value={worker.registeredAt || '-'} />
                </div>
              )}
            </Section>

            {/* 비상연락처 */}
            <Section
              title="비상연락처"
              icon={<Phone size={16} />}
              onEdit={() => {
                setEditEmergencyName(mockEmergencyContact.name);
                setEditEmergencyPhone(mockEmergencyContact.phone);
                setEditEmergencyRelation(mockEmergencyContact.relationship);
                setEditingSection('emergency');
              }}
              isEditing={editingSection === 'emergency'}
            >
              {editingSection === 'emergency' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">이름</label>
                    <input
                      type="text"
                      value={editEmergencyName}
                      onChange={(e) => setEditEmergencyName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">관계</label>
                    <input
                      type="text"
                      value={editEmergencyRelation}
                      onChange={(e) => setEditEmergencyRelation(e.target.value)}
                      placeholder="예: 배우자, 자녀, 부모"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">연락처</label>
                    <input
                      type="tel"
                      value={editEmergencyPhone}
                      onChange={(e) => setEditEmergencyPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="flex-1 py-2 rounded-lg font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveEmergency}
                      className="flex-1 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-1"
                    >
                      <Check size={16} />
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{mockEmergencyContact.name}</p>
                      <p className="text-sm text-slate-500">{mockEmergencyContact.relationship}</p>
                    </div>
                    <a
                      href={`tel:${mockEmergencyContact.phone}`}
                      className="p-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      title="전화하기"
                    >
                      <Phone size={18} />
                    </a>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{mockEmergencyContact.phone}</p>
                </>
              )}
            </Section>

            {/* 건강정보 */}
            <Section
              title="건강정보"
              icon={<Heart size={16} />}
              badge="준비중"
              badgeColor="gray"
              className=""
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <p className="text-xs text-slate-500 mb-1">혈액형</p>
                  <select
                    value={editBloodType}
                    onChange={(e) => setEditBloodType(e.target.value)}
                    className="w-full text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    {BLOOD_TYPE_OPTIONS.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <HealthInfoItem label="하루 흡연량" value={`${mockHealthInfo.smokingPerDay || 0}개비`} />
                <HealthInfoItem label="1주일 음주" value={`${mockHealthInfo.drinkingPerWeek || 0}회`} />
                <HealthInfoItem label="1회 섭취량" value={mockHealthInfo.drinkingAmount || '-'} />
                <HealthInfoItem label="최고혈압" value={`${mockHealthInfo.bloodPressureHigh || '-'} mmHg`} />
                <HealthInfoItem label="최저혈압" value={`${mockHealthInfo.bloodPressureLow || '-'} mmHg`} />
                <HealthInfoItem label="65세 이상" value={worker.isSenior ? '예' : '아니오'} highlight={worker.isSenior} />
                <HealthInfoItem label="기저질환" value={mockHealthInfo.hasChronicDisease ? '있음' : '없음'} highlight={mockHealthInfo.hasChronicDisease} />
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  혈압 연속 측정 데이터 관리 기능 (사진 촬영 등록)은 준비중입니다.
                </p>
              </div>
            </Section>

            {/* 채용 서류 */}
            <Section
              title="채용 서류"
              icon={<FileText size={16} />}
              badge={`${documents.length}개`}
              className=""
              headerActions={
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-gray-200 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Download size={12} />
                    전체 다운로드 (ZIP)
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded transition-colors"
                  >
                    <Upload size={12} />
                    업로드
                  </button>
                </div>
              }
            >
              <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText size={16} className="text-orange-500 shrink-0" />
                      <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">등록된 서류가 없습니다</p>
                )}
              </div>
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );

  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(modalContent, document.body);
}

// 섹션 컴포넌트 (아코디언 제거, 항상 펼침)
function Section({
  title,
  icon,
  children,
  badge,
  badgeColor = 'orange',
  onEdit,
  isEditing,
  headerActions,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: 'orange' | 'gray';
  onEdit?: () => void;
  isEditing?: boolean;
  headerActions?: React.ReactNode;
  className?: string;
}) {
  const badgeStyles = {
    orange: 'text-orange-600 bg-orange-100',
    gray: 'text-slate-500 bg-gray-200',
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          <span className="font-bold text-sm text-slate-700">{title}</span>
          {badge && (
            <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${badgeStyles[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          {onEdit && !isEditing && (
            <button
              onClick={onEdit}
              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title="수정"
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// 정보 행 컴포넌트
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm text-slate-500 w-16 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

// 건강정보 아이템 컴포넌트
function HealthInfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-2.5 rounded-lg ${highlight ? 'bg-orange-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${highlight ? 'text-orange-600' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}
