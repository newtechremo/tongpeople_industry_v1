// =============================================
// 테스트용 근로자 시드 Edge Function
// =============================================
// auth.users와 users 테이블에 제대로 연결된 테스트 계정 생성
//
// 사용법:
// 1. 생성: POST /seed-workers 또는 GET /seed-workers?action=create
// 2. 삭제: GET /seed-workers?action=delete
//
// 테스트 계정 로그인:
// - 전화번호: 01010000001 ~ 01010100004 (팀별 번호)
// - 비밀번호: test1234!
// =============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 테스트 근로자 데이터 정의
// 팀 구조:
// 1. 통하는사람들 (안전팀) - 4명
// 2. (주)대한전기 (전기1팀) - 5명
// 3. (주)대한전기 (설비팀) - 4명
// 4. (주)대한전기 (건축팀) - 5명
// 5. 통하는사람들 (설계팀) - 4명
// 총 22명, 고령자 7명

interface TeamData {
  name: string;
  contactName: string;
  contactPhone: string;
  members: WorkerData[];
}

interface WorkerData {
  name: string;
  phone: string;
  birthDate: string;  // YYYY-MM-DD
  role: 'TEAM_ADMIN' | 'WORKER';
  password: string;
}

const TEST_TEAMS: TeamData[] = [
  {
    name: '통하는사람들 (안전팀)',
    contactName: '김안전',
    contactPhone: '010-1000-0001',
    members: [
      { name: '김안전', phone: '01010000001', birthDate: '1975-03-15', role: 'TEAM_ADMIN', password: 'test1234!' },
      { name: '이보안', phone: '01010000002', birthDate: '1982-07-22', role: 'WORKER', password: 'test1234!' },
      { name: '박점검', phone: '01010000003', birthDate: '1958-11-08', role: 'WORKER', password: 'test1234!' },  // 고령자
      { name: '최감시', phone: '01010000004', birthDate: '1990-05-20', role: 'WORKER', password: 'test1234!' },
    ],
  },
  {
    name: '(주)대한전기 (전기1팀)',
    contactName: '이전기',
    contactPhone: '010-2000-0001',
    members: [
      { name: '이전기', phone: '01020000001', birthDate: '1978-01-10', role: 'TEAM_ADMIN', password: 'test1234!' },
      { name: '김전선', phone: '01020000002', birthDate: '1985-09-30', role: 'WORKER', password: 'test1234!' },
      { name: '박배선', phone: '01020000003', birthDate: '1956-12-25', role: 'WORKER', password: 'test1234!' },  // 고령자
      { name: '정전력', phone: '01020000004', birthDate: '1992-04-18', role: 'WORKER', password: 'test1234!' },
      { name: '한전압', phone: '01020000005', birthDate: '1988-08-05', role: 'WORKER', password: 'test1234!' },
    ],
  },
  {
    name: '(주)대한전기 (설비팀)',
    contactName: '박설비',
    contactPhone: '010-2010-0001',
    members: [
      { name: '박설비', phone: '01020100001', birthDate: '1972-06-01', role: 'TEAM_ADMIN', password: 'test1234!' },
      { name: '김배관', phone: '01020100002', birthDate: '1959-03-20', role: 'WORKER', password: 'test1234!' },  // 고령자
      { name: '이펌프', phone: '01020100003', birthDate: '1987-11-11', role: 'WORKER', password: 'test1234!' },
      { name: '최공조', phone: '01020100004', birthDate: '1994-02-14', role: 'WORKER', password: 'test1234!' },
    ],
  },
  {
    name: '(주)대한전기 (건축팀)',
    contactName: '최건축',
    contactPhone: '010-2020-0001',
    members: [
      { name: '최건축', phone: '01020200001', birthDate: '1970-08-15', role: 'TEAM_ADMIN', password: 'test1234!' },
      { name: '김목수', phone: '01020200002', birthDate: '1955-04-22', role: 'WORKER', password: 'test1234!' },  // 고령자
      { name: '이철근', phone: '01020200003', birthDate: '1983-10-08', role: 'WORKER', password: 'test1234!' },
      { name: '박콘크리트', phone: '01020200004', birthDate: '1991-01-20', role: 'WORKER', password: 'test1234!' },
      { name: '정미장', phone: '01020200005', birthDate: '1957-07-30', role: 'WORKER', password: 'test1234!' },  // 고령자
    ],
  },
  {
    name: '통하는사람들 (설계팀)',
    contactName: '정설계',
    contactPhone: '010-1010-0001',
    members: [
      { name: '정설계', phone: '01010100001', birthDate: '1980-12-01', role: 'TEAM_ADMIN', password: 'test1234!' },
      { name: '김도면', phone: '01010100002', birthDate: '1989-05-15', role: 'WORKER', password: 'test1234!' },
      { name: '이캐드', phone: '01010100003', birthDate: '1995-09-22', role: 'WORKER', password: 'test1234!' },
      { name: '박3D', phone: '01010100004', birthDate: '1960-02-28', role: 'WORKER', password: 'test1234!' },  // 고령자
    ],
  },
];

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 요청 파라미터 확인
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';

    // 기존 회사/현장 가져오기
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .order('id')
      .limit(1)
      .single();

    if (!company) {
      return new Response(
        JSON.stringify({ error: '회사가 없습니다. 먼저 회원가입을 완료하세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('company_id', company.id)
      .order('id')
      .limit(1)
      .single();

    if (!site) {
      return new Response(
        JSON.stringify({ error: '현장이 없습니다. 먼저 회원가입을 완료하세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // action=delete: 테스트 데이터 삭제
    if (action === 'delete') {
      return await deleteTestData(supabase, company.id, site.id);
    }

    // action=create (기본): 테스트 데이터 생성
    const results = {
      teams: [] as { name: string; id: number }[],
      workers: [] as { name: string; phone: string; role: string; teamName: string }[],
      errors: [] as string[],
      summary: {
        totalTeams: 0,
        totalWorkers: 0,
        seniors: 0,
        teamAdmins: 0,
      },
    };

    // 기존 테스트 팀 삭제 (기본 팀 제외)
    await supabase
      .from('partners')
      .delete()
      .eq('company_id', company.id)
      .eq('site_id', site.id)
      .not('name', 'in', '("관리자","일반근로자")');

    // 각 팀과 팀원 생성
    for (const teamData of TEST_TEAMS) {
      try {
        // 팀(협력업체) 생성
        const { data: partner, error: partnerError } = await supabase
          .from('partners')
          .insert({
            company_id: company.id,
            site_id: site.id,
            name: teamData.name,
            contact_name: teamData.contactName,
            contact_phone: teamData.contactPhone,
            is_active: true,
          })
          .select()
          .single();

        if (partnerError || !partner) {
          results.errors.push(`팀 생성 실패: ${teamData.name} - ${partnerError?.message}`);
          continue;
        }

        results.teams.push({ name: teamData.name, id: partner.id });
        results.summary.totalTeams++;

        // 팀원 생성
        for (const member of teamData.members) {
          try {
            // 1. Auth 사용자 생성
            const fakeEmail = `${member.phone}@phone.tongpass.local`;

            // 기존 사용자 확인
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .eq('phone', member.phone)
              .single();

            if (existingUser) {
              results.errors.push(`이미 존재: ${member.name} (${member.phone})`);
              continue;
            }

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: fakeEmail,
              password: member.password,
              email_confirm: true,
              user_metadata: {
                name: member.name,
                phone: member.phone,
              },
            });

            if (authError || !authUser.user) {
              results.errors.push(`Auth 생성 실패: ${member.name} - ${authError?.message}`);
              continue;
            }

            // 2. users 테이블에 프로필 생성
            const { error: userError } = await supabase
              .from('users')
              .insert({
                id: authUser.user.id,
                company_id: company.id,
                site_id: site.id,
                partner_id: partner.id,
                name: member.name,
                phone: member.phone,
                birth_date: member.birthDate,
                role: member.role,
                is_active: true,
              });

            if (userError) {
              // 롤백: Auth 사용자 삭제
              await supabase.auth.admin.deleteUser(authUser.user.id);
              results.errors.push(`프로필 생성 실패: ${member.name} - ${userError.message}`);
              continue;
            }

            results.workers.push({
              name: member.name,
              phone: member.phone,
              role: member.role,
              teamName: teamData.name,
            });

            results.summary.totalWorkers++;
            if (member.role === 'TEAM_ADMIN') {
              results.summary.teamAdmins++;
            }

            // 고령자 체크 (65세 이상)
            const birthYear = parseInt(member.birthDate.split('-')[0]);
            const currentYear = new Date().getFullYear();
            if (currentYear - birthYear >= 65) {
              results.summary.seniors++;
            }
          } catch (memberError) {
            results.errors.push(`팀원 처리 오류: ${member.name} - ${memberError}`);
          }
        }
      } catch (teamError) {
        results.errors.push(`팀 처리 오류: ${teamData.name} - ${teamError}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '테스트 근로자 시드 완료',
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: `서버 오류: ${error}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// 테스트 데이터 삭제 함수
async function deleteTestData(
  supabase: ReturnType<typeof createClient>,
  companyId: number,
  siteId: number
) {
  const deleted = {
    users: 0,
    teams: 0,
    errors: [] as string[],
  };

  try {
    // 테스트 근로자 조회 (TEAM_ADMIN, WORKER)
    const { data: testUsers } = await supabase
      .from('users')
      .select('id, phone')
      .eq('company_id', companyId)
      .in('role', ['TEAM_ADMIN', 'WORKER']);

    if (testUsers) {
      for (const user of testUsers) {
        // Auth 사용자 삭제
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        if (authError) {
          deleted.errors.push(`Auth 삭제 실패: ${user.phone}`);
        }
        // users 테이블은 cascade로 자동 삭제됨
        deleted.users++;
      }
    }

    // 테스트 팀 삭제
    const { data: deletedTeams } = await supabase
      .from('partners')
      .delete()
      .eq('company_id', companyId)
      .eq('site_id', siteId)
      .not('name', 'in', '("관리자","일반근로자")')
      .select();

    deleted.teams = deletedTeams?.length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: '테스트 데이터 삭제 완료',
        deleted,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `삭제 오류: ${error}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
