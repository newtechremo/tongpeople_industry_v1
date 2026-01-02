import { useState } from 'react';
import {
  X,
  Crown,
  UserCheck,
  UserX,
  Clock,
  Phone,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  Heart,
  Users,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Flag,
} from 'lucide-react';
import type { Worker, EmergencyContact, HealthInfo, WorkerDocument, DocumentType, DOCUMENT_TYPE_LABELS } from '@tong-pass/shared';

interface WorkerDetailDrawerProps {
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
];

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  SAFETY_PLEDGE: '안전관리서약서',
  TRAINING_CERT: '교육이수및보호구수령확인서',
  PRIVACY_CONSENT: '개인정보수집이용동의서',
  HEALTH_QUESTIONNAIRE: '건강문진표',
  SAFETY_EDUCATION_CERT: '기초안전보건교육증',
  LICENSE: '자격증',
  OTHER: '기타',
};

export default function WorkerDetailDrawer({ worker, onClose }: WorkerDetailDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'work', 'documents', 'emergency', 'health']);

  if (!worker) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const renderAttendanceStatus = () => {
    if (worker.attendanceStatus === 'CHECKED_IN') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold text-green-700 bg-green-100 rounded-full">
          <UserCheck size={14} />
          출근 중
        </span>
      );
    }
    if (worker.attendanceStatus === 'CHECKED_OUT') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold text-blue-700 bg-blue-100 rounded-full">
          <UserX size={14} />
          퇴근
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold text-gray-600 bg-gray-100 rounded-full">
        <Clock size={14} />
        미출근
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                {worker.role === 'TEAM_ADMIN' && (
                  <Crown size={20} className="text-yellow-500" />
                )}
                <h2 className="text-xl font-black text-slate-800">
                  {worker.name} <span className="text-slate-500 font-normal">(만 {worker.age}세)</span>
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {worker.role === 'TEAM_ADMIN' && (
                  <span className="px-2 py-0.5 text-xs font-bold text-yellow-700 bg-yellow-100 rounded">
                    팀 관리자
                  </span>
                )}
                {worker.isRepresentative && (
                  <span className="px-2 py-0.5 text-xs font-bold text-purple-700 bg-purple-100 rounded">
                    근로자 대표
                  </span>
                )}
                {renderAttendanceStatus()}
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

        {/* 고령 근로자 경고 */}
        {worker.isSenior && (
          <div className="mx-6 mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle size={18} />
              <span className="font-bold">고령 근로자 - 주의</span>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              만 65세 이상 근로자입니다. 안전 관리에 주의가 필요합니다.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* 기본 및 소속 정보 */}
          <Section
            title="기본 및 소속 정보"
            icon={<Building2 size={18} />}
            isExpanded={expandedSections.includes('basic')}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-3">
              <InfoRow icon={<Users size={16} />} label="팀(업체)" value={worker.teamName || '-'} />
              <InfoRow icon={<Briefcase size={16} />} label="직책/직종" value={worker.position || '-'} />
              <InfoRow
                icon={<Phone size={16} />}
                label="연락처"
                value={
                  <a href={`tel:${worker.phone}`} className="text-orange-600 hover:underline">
                    {worker.phone}
                  </a>
                }
              />
              <InfoRow icon={<Calendar size={16} />} label="생년월일" value={`${worker.birthDate} (${worker.age}세)`} />
              <InfoRow icon={<Flag size={16} />} label="국적" value={worker.nationality || '대한민국'} />
              <InfoRow icon={<Calendar size={16} />} label="등록일" value={worker.registeredAt || '-'} />
            </div>
          </Section>

          {/* 근무 및 안전 현황 */}
          <Section
            title="근무 및 안전 현황"
            icon={<Clock size={18} />}
            isExpanded={expandedSections.includes('work')}
            onToggle={() => toggleSection('work')}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-slate-500">누적 근무</p>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {worker.totalWorkDays || 0}<span className="text-sm font-normal text-slate-500">일</span>
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-slate-500">이번 달 출근</p>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {worker.monthlyWorkDays || 0}<span className="text-sm font-normal text-slate-500">일</span>
                </p>
              </div>
            </div>
          </Section>

          {/* 채용 서류 */}
          <Section
            title="채용 서류"
            icon={<FileText size={18} />}
            isExpanded={expandedSections.includes('documents')}
            onToggle={() => toggleSection('documents')}
            badge={`${mockDocuments.length}/10`}
          >
            <div className="space-y-2">
              {mockDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{DOCUMENT_LABELS[doc.type]}</p>
                      <p className="text-xs text-slate-400">{doc.name}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <Trash2 size={16} className="text-slate-400" />
                  </button>
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors">
                <Upload size={16} />
                서류 업로드
              </button>
            </div>
          </Section>

          {/* 비상연락처 */}
          <Section
            title="비상연락처"
            icon={<Phone size={18} />}
            isExpanded={expandedSections.includes('emergency')}
            onToggle={() => toggleSection('emergency')}
          >
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{mockEmergencyContact.name}</p>
                  <p className="text-sm text-slate-500">{mockEmergencyContact.relationship}</p>
                </div>
                <a
                  href={`tel:${mockEmergencyContact.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors"
                >
                  <Phone size={14} />
                  {mockEmergencyContact.phone}
                </a>
              </div>
            </div>
          </Section>

          {/* 건강정보 */}
          <Section
            title="건강정보"
            icon={<Heart size={18} />}
            isExpanded={expandedSections.includes('health')}
            onToggle={() => toggleSection('health')}
          >
            <div className="grid grid-cols-2 gap-3">
              <HealthInfoItem label="혈액형" value={mockHealthInfo.bloodType || '-'} />
              <HealthInfoItem label="하루 흡연량" value={`${mockHealthInfo.smokingPerDay || 0}개비`} />
              <HealthInfoItem label="1주일 음주횟수" value={`${mockHealthInfo.drinkingPerWeek || 0}회`} />
              <HealthInfoItem label="음주 1회 섭취량" value={mockHealthInfo.drinkingAmount || '-'} />
              <HealthInfoItem label="최고혈압" value={`${mockHealthInfo.bloodPressureHigh || '-'} mmHg`} />
              <HealthInfoItem label="최저혈압" value={`${mockHealthInfo.bloodPressureLow || '-'} mmHg`} />
              <HealthInfoItem label="65세 이상 여부" value={worker.isSenior ? '예' : '아니오'} highlight={worker.isSenior} />
              <HealthInfoItem label="기저질환 여부" value={mockHealthInfo.hasChronicDisease ? '있음' : '없음'} highlight={mockHealthInfo.hasChronicDisease} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// 섹션 컴포넌트
function Section({
  title,
  icon,
  children,
  isExpanded,
  onToggle,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          <span className="font-bold text-slate-800">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-bold text-orange-600 bg-orange-100 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
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
    <div className="flex items-center gap-3">
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm text-slate-500 w-20">{label}</span>
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
    <div className={`p-3 rounded-lg ${highlight ? 'bg-orange-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${highlight ? 'text-orange-600' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}
