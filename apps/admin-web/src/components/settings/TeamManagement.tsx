import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Building2, Handshake, User } from 'lucide-react';
import { useSites } from '@/context/SitesContext';
import { useAuth } from '@/context/AuthContext';
import TeamAddModal from './TeamAddModal';
import TeamEditModal from './TeamEditModal';
import { useDialog } from '@/hooks/useDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getPartnersWithWorkerCount, deletePartner, createPartner, updatePartner } from '@/api/partners';
import type { PartnerWithWorkerCount } from '@/api/partners';

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
  workerCount: number;
  createdAt: string;
}

export default function TeamManagement({
  autoOpenModal = false,
  onModalAutoOpened,
}: TeamManagementProps) {
  const { sites } = useSites();
  const { user } = useAuth();
  const { dialogState, showConfirm, showAlert, closeDialog } = useDialog();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [filterSiteId, setFilterSiteId] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 팀 데이터 로드
  useEffect(() => {
    async function loadTeams() {
      if (sites.length === 0) return;

      try {
        setLoading(true);
        setError(null);

        // 필터링된 현장 또는 모든 현장의 팀 로드
        const siteIds = filterSiteId === 'ALL' ? sites.map(s => s.id) : [filterSiteId];

        const allTeams: Team[] = [];

        for (const siteId of siteIds) {
          const site = sites.find(s => s.id === siteId);
          if (!site) continue;

          const partners = await getPartnersWithWorkerCount(siteId);

          // Partner 데이터를 Team 형식으로 변환
          const teamData: Team[] = partners.map(partner => ({
            id: partner.id,
            siteId: partner.site_id || siteId,
            siteName: site.name,
            companyName: partner.company_name || partner.name,
            teamName: partner.team_name || '',
            displayName: partner.name,
            isPartner: partner.is_partner || false,
            workerCount: partner.workerCount,
            createdAt: partner.created_at || '',
          }));

          allTeams.push(...teamData);
        }

        setTeams(allTeams);
      } catch (err) {
        console.error('Failed to load teams:', err);
        setError('팀 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, [sites, filterSiteId]);

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

  const handleAddTeam = async (newTeam: {
    siteId: number;
    companyName: string;
    teamName: string;
    isPartner: boolean;
    displayName: string;
  }) => {
    if (!user?.companyId) {
      showAlert({
        title: '오류',
        message: '회사 정보를 찾을 수 없습니다.',
        variant: 'danger',
      });
      return;
    }

    try {
      const site = sites.find(s => s.id === newTeam.siteId);

      // API로 팀 생성
      const partner = await createPartner({
        company_id: user.companyId,
        site_id: newTeam.siteId,
        name: newTeam.displayName,  // 표시명 저장
        is_partner: newTeam.isPartner,
        company_name: newTeam.companyName,
        team_name: newTeam.teamName || null,
        is_active: true,
      });

      // 로컬 상태에 추가
      const team: Team = {
        id: partner.id,
        siteId: newTeam.siteId,
        siteName: site?.name || '',
        companyName: newTeam.companyName,
        teamName: newTeam.teamName,
        displayName: newTeam.displayName,
        isPartner: newTeam.isPartner,
        workerCount: 0,
        createdAt: partner.created_at || new Date().toISOString(),
      };
      setTeams(prev => [...prev, team]);

      showAlert({
        title: '팀 추가 완료',
        message: `"${team.displayName}" 팀이 추가되었습니다.`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to create team:', error);
      showAlert({
        title: '팀 추가 실패',
        message: '팀 추가 중 오류가 발생했습니다.',
        variant: 'danger',
      });
    }
  };

  const handleDeleteTeam = (team: Team) => {
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
      onConfirm: async () => {
        try {
          await deletePartner(team.id);
          // 로컬 상태 업데이트
          setTeams(prev => prev.filter(t => t.id !== team.id));
          showAlert({
            title: '삭제 완료',
            message: '팀이 삭제되었습니다.',
            variant: 'success',
          });
        } catch (error) {
          console.error('Failed to delete team:', error);
          showAlert({
            title: '삭제 실패',
            message: '팀 삭제 중 오류가 발생했습니다.',
            variant: 'danger',
          });
        }
      },
    });
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };

  const handleUpdateTeam = async (teamId: number, updates: {
    isPartner: boolean;
    companyName: string;
    teamName: string;
    displayName: string;
  }) => {
    try {
      await updatePartner(teamId, {
        name: updates.displayName,
        is_partner: updates.isPartner,
        company_name: updates.companyName,
        team_name: updates.teamName || null,
      });

      // 로컬 상태 업데이트
      setTeams(prev => prev.map(t =>
        t.id === teamId
          ? {
              ...t,
              displayName: updates.displayName,
              companyName: updates.companyName,
              teamName: updates.teamName,
              isPartner: updates.isPartner,
            }
          : t
      ));

      showAlert({
        title: '수정 완료',
        message: '팀 정보가 변경되었습니다.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to update team:', error);
      showAlert({
        title: '수정 실패',
        message: '팀 수정 중 오류가 발생했습니다.',
        variant: 'danger',
      });
    }
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
          <strong>안내:</strong> 협력업체 및 팀을 등록하여 근로자를 관리하세요.
        </p>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500">팀 목록을 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !loading && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 팀 목록 (현장별 그룹핑) */}
      {!loading && !error && (
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
                  className="bg-white border border-gray-200 hover:border-orange-300 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-orange-100">
                        <Users size={20} className="text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800">{team.displayName}</h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {team.workerCount}명
                          </span>
                        </div>
                      </div>
                    </div>

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
      )}

      {/* 팀 추가 모달 */}
      <TeamAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        sites={sites}
        onAdd={handleAddTeam}
      />

      {/* 팀 수정 모달 */}
      <TeamEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
        onUpdate={handleUpdateTeam}
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
