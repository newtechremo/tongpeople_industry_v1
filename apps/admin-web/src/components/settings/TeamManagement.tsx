import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Building2, Handshake, User } from 'lucide-react';
import { useSites } from '@/context/SitesContext';
import TeamAddModal from './TeamAddModal';
import { useDialog } from '@/hooks/useDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';

// Props 타입 정의
interface TeamManagementProps {
  autoOpenModal?: boolean;
  onModalAutoOpened?: () => void;
}

// 팀 타입 정의
interface Team {
  id: number;
  siteId: number;
  siteName: string;
  companyName: string;
  teamName: string;
  displayName: string;
  isPartner: boolean;
  isDefault: boolean; // 기본 팀 여부 (관리자팀, 일반근로자팀)
  workerCount: number;
  createdAt: string;
}

// Mock 팀 데이터
const mockTeams: Team[] = [
  {
    id: 1,
    siteId: 1,
    siteName: '서울본사',
    companyName: '통하는사람들',
    teamName: '관리자',
    displayName: '통하는사람들 (관리자)',
    isPartner: false,
    isDefault: true,
    workerCount: 3,
    createdAt: '2024-01-01',
  },
  {
    id: 2,
    siteId: 1,
    siteName: '서울본사',
    companyName: '통하는사람들',
    teamName: '일반근로자',
    displayName: '통하는사람들 (일반근로자)',
    isPartner: false,
    isDefault: true,
    workerCount: 5,
    createdAt: '2024-01-01',
  },
  {
    id: 3,
    siteId: 1,
    siteName: '서울본사',
    companyName: '(주)대한전기',
    teamName: '전기1팀',
    displayName: '[협력사] (주)대한전기 (전기1팀)',
    isPartner: true,
    isDefault: false,
    workerCount: 8,
    createdAt: '2024-03-15',
  },
  {
    id: 4,
    siteId: 1,
    siteName: '서울본사',
    companyName: 'XX건설',
    teamName: '미장팀',
    displayName: '[협력사] XX건설 (미장팀)',
    isPartner: true,
    isDefault: false,
    workerCount: 12,
    createdAt: '2024-04-20',
  },
  {
    id: 5,
    siteId: 2,
    siteName: '부산공장',
    companyName: '통하는사람들',
    teamName: '관리자',
    displayName: '통하는사람들 (관리자)',
    isPartner: false,
    isDefault: true,
    workerCount: 2,
    createdAt: '2024-02-01',
  },
];

export default function TeamManagement({
  autoOpenModal = false,
  onModalAutoOpened,
}: TeamManagementProps) {
  const { sites } = useSites();
  const { dialogState, showConfirm, showAlert, closeDialog } = useDialog();
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterSiteId, setFilterSiteId] = useState<number | 'ALL'>('ALL');

  // autoOpenModal prop이 true이면 모달 자동 열기
  useEffect(() => {
    if (autoOpenModal) {
      setIsAddModalOpen(true);
      onModalAutoOpened?.();
    }
  }, [autoOpenModal, onModalAutoOpened]);

  // 필터링된 팀 목록
  const filteredTeams = filterSiteId === 'ALL'
    ? teams
    : teams.filter(team => team.siteId === filterSiteId);

  // 현장별 그룹핑
  const groupedTeams = filteredTeams.reduce((acc, team) => {
    const siteName = team.siteName;
    if (!acc[siteName]) {
      acc[siteName] = [];
    }
    acc[siteName].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  const handleAddTeam = (newTeam: {
    siteId: number;
    companyName: string;
    teamName: string;
    isPartner: boolean;
    displayName: string;
  }) => {
    const site = sites.find(s => s.id === newTeam.siteId);
    const team: Team = {
      id: Date.now(),
      siteId: newTeam.siteId,
      siteName: site?.name || '',
      companyName: newTeam.companyName,
      teamName: newTeam.teamName,
      displayName: newTeam.displayName,
      isPartner: newTeam.isPartner,
      isDefault: false,
      workerCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTeams(prev => [...prev, team]);
    showAlert({
      title: '팀 추가 완료',
      message: `"${team.displayName}" 팀이 추가되었습니다.`,
      variant: 'success',
    });
  };

  const handleDeleteTeam = (team: Team) => {
    if (team.isDefault) {
      showAlert({
        title: '삭제 불가',
        message: '기본 팀은 삭제할 수 없습니다.',
        variant: 'warning',
      });
      return;
    }
    if (team.workerCount > 0) {
      showAlert({
        title: '삭제 불가',
        message: `이 팀에 소속된 근로자가 ${team.workerCount}명 있습니다.\n먼저 근로자를 다른 팀으로 이동해주세요.`,
        variant: 'warning',
      });
      return;
    }
    showConfirm({
      title: '팀 삭제',
      message: `"${team.displayName}" 팀을 삭제하시겠습니까?`,
      confirmText: '삭제',
      variant: 'danger',
      onConfirm: () => {
        setTeams(prev => prev.filter(t => t.id !== team.id));
        showAlert({
          title: '삭제 완료',
          message: '팀이 삭제되었습니다.',
          variant: 'success',
        });
      },
    });
  };

  const handleEditTeam = (team: Team) => {
    if (team.isDefault) {
      showAlert({
        title: '수정 불가',
        message: '기본 팀은 수정할 수 없습니다.',
        variant: 'warning',
      });
      return;
    }
    showAlert({
      title: '준비 중',
      message: '팀 수정 기능은 준비중입니다.',
      variant: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">팀(업체) 관리</h2>
          <p className="text-sm text-slate-500 mt-1">
            등록된 팀: {filteredTeams.length}개
            {filterSiteId !== 'ALL' && ` (${sites.find(s => s.id === filterSiteId)?.name})`}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white
                     bg-gradient-to-r from-orange-500 to-orange-600
                     hover:from-orange-600 hover:to-orange-700
                     shadow-sm transition-all"
        >
          <Plus size={18} />
          팀 추가
        </button>
      </div>

      {/* 현장 필터 */}
      {sites.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">현장 필터:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterSiteId('ALL')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterSiteId === 'ALL'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {sites.map(site => (
              <button
                key={site.id}
                onClick={() => setFilterSiteId(site.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterSiteId === site.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {site.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 안내 박스 */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>안내:</strong> 현장을 생성하면 <strong>관리자 팀</strong>과 <strong>일반 근로자 팀</strong>이 자동으로 생성됩니다.
          기본 팀은 삭제할 수 없습니다.
        </p>
      </div>

      {/* 팀 목록 (현장별 그룹핑) */}
      <div className="space-y-6">
        {Object.entries(groupedTeams).map(([siteName, siteTeams]) => (
          <div key={siteName} className="space-y-3">
            {/* 현장 헤더 */}
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-slate-400" />
              <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider">{siteName}</h3>
              <span className="text-xs text-slate-400">({siteTeams.length}개 팀)</span>
            </div>

            {/* 팀 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {siteTeams.map(team => (
                <div
                  key={team.id}
                  className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all ${
                    team.isDefault
                      ? 'border-gray-200 bg-gray-50'
                      : team.isPartner
                        ? 'border-blue-200 hover:border-blue-300'
                        : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${
                        team.isDefault
                          ? 'bg-gray-200'
                          : team.isPartner
                            ? 'bg-blue-100'
                            : 'bg-orange-100'
                      }`}>
                        {team.isPartner ? (
                          <Handshake size={20} className="text-blue-600" />
                        ) : (
                          <Users size={20} className={team.isDefault ? 'text-gray-500' : 'text-orange-600'} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800">{team.displayName}</h4>
                          {team.isDefault && (
                            <span className="px-1.5 py-0.5 text-xs font-bold text-gray-500 bg-gray-200 rounded">
                              기본
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {team.workerCount}명
                          </span>
                          {team.isPartner && (
                            <span className="px-1.5 py-0.5 text-xs font-medium text-blue-600 bg-blue-100 rounded">
                              협력사
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!team.isDefault && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredTeams.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium">등록된 팀이 없습니다</p>
            <p className="text-sm mt-1">새 팀을 추가해주세요</p>
          </div>
        )}
      </div>

      {/* 팀 추가 모달 */}
      <TeamAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        sites={sites}
        onAdd={handleAddTeam}
      />

      {/* 공통 다이얼로그 */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        alertOnly={dialogState.alertOnly}
      />
    </div>
  );
}
