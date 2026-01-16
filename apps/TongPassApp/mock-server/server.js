/**
 * TongPass Mock API Server
 * 테스트용 가짜 응답 서버
 * - 사용자별 출퇴근 상태 관리
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 요청 로깅
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
    console.log('  Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ==================== 테스트 데이터 ====================

// 테스트용 회사코드
const TEST_COMPANY_CODE = 'TEST1234';

// 테스트용 인증번호 (고정)
const TEST_SMS_CODE = '123456';

// 테스트용 전화번호
const EXISTING_MEMBER_PHONE = '01099999999';  // 기존 회원 (바로 로그인)
const PRE_REGISTERED_PHONE = '01088888888';   // 선등록 사용자 (Pre-fill)

// 메모리 저장소 (서버 재시작시 초기화)
const storage = {
  workers: {},       // workerId -> worker 정보 (출퇴근 상태 포함)
  smsRequests: {},   // phoneNumber -> SMS 정보
  tokens: {},        // token -> workerId 매핑
};

// ==================== 헬퍼 함수 ====================

/**
 * Authorization 헤더에서 workerId 추출
 */
function getWorkerIdFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  return storage.tokens[token] || null;
}

/**
 * 토큰 생성 및 저장
 */
function createToken(workerId) {
  const token = 'mock-token-' + workerId + '-' + Date.now();
  storage.tokens[token] = workerId;
  return token;
}

// ==================== 인증 API ====================

/**
 * 회사코드 검증
 * POST /auth/verify-company-code
 */
app.post('/auth/verify-company-code', (req, res) => {
  const { companyCode } = req.body;

  console.log(`  회사코드 검증: ${companyCode}`);

  // 테스트 회사코드 확인
  if (companyCode?.toUpperCase() === TEST_COMPANY_CODE) {
    return res.json({
      success: true,
      company: {
        id: 'company-001',
        name: '테스트 회사',
        code: TEST_COMPANY_CODE,
      },
      sites: [
        {
          id: 'site-001',
          name: '서울 본사',
          address: '서울특별시 강남구',
        },
        {
          id: 'site-002',
          name: '대전 공장',
          address: '대전광역시 유성구',
        },
      ],
    });
  }

  // 잘못된 회사코드
  return res.status(400).json({
    code: 'INVALID_COMPANY_CODE',
    message: '유효하지 않은 회사코드입니다.',
    userMessage: '회사코드를 다시 확인해주세요.',
  });
});

/**
 * SMS 인증번호 요청
 * POST /auth/request-sms
 */
app.post('/auth/request-sms', (req, res) => {
  const { phoneNumber } = req.body;

  console.log(`  SMS 요청: ${phoneNumber}`);
  console.log(`  [테스트] 인증번호: ${TEST_SMS_CODE}`);

  // 요청 저장
  storage.smsRequests[phoneNumber] = {
    code: TEST_SMS_CODE,
    expiresAt: Date.now() + 180000, // 3분
  };

  return res.json({
    success: true,
    expiresIn: 180,
  });
});

/**
 * SMS 인증 확인
 * POST /auth/verify-sms
 */
app.post('/auth/verify-sms', (req, res) => {
  const { phoneNumber, code } = req.body;

  console.log(`  SMS 인증: ${phoneNumber}, 코드: ${code}`);

  // 테스트 인증번호 확인
  if (code === TEST_SMS_CODE) {
    // 시나리오 1: 기존 회원 로그인 (01099999999)
    if (phoneNumber === EXISTING_MEMBER_PHONE) {
      const workerId = 'worker-existing-member';
      const accessToken = createToken(workerId);
      const refreshToken = 'mock-refresh-existing-' + Date.now();

      // 기존 회원 정보가 없으면 생성
      if (!storage.workers[workerId]) {
        storage.workers[workerId] = {
          id: workerId,
          phoneNumber: EXISTING_MEMBER_PHONE,
          name: '기존회원',
          birthDate: '19850101',
          gender: 'M',
          nationality: '대한민국',
          jobTitle: '전기기사',
          status: 'ACTIVE',
          commuteStatus: 'WORK_OFF',
          checkInTime: null,
          checkOutTime: null,
        };
      }

      console.log(`  기존 회원 로그인: ${EXISTING_MEMBER_PHONE}`);
      return res.json({
        verified: true,
        isRegistered: true,
        workerId,
        status: 'ACTIVE',
        accessToken,
        refreshToken,
      });
    }

    // 시나리오 2: 선등록 사용자 (01088888888)
    if (phoneNumber === PRE_REGISTERED_PHONE) {
      console.log(`  선등록 사용자: ${PRE_REGISTERED_PHONE}`);
      return res.json({
        verified: true,
        isRegistered: false,
        preRegisteredData: {
          name: '선등록테스트',
          birthDate: '19900315',
          gender: 'M',
          nationality: '대한민국',
          teamId: 'team-001',
          jobTitle: '전기기사',
        },
      });
    }

    // 이미 등록된 사용자인지 확인 (동적 등록된 사용자)
    const existingWorker = Object.values(storage.workers).find(
      w => w.phoneNumber === phoneNumber
    );

    if (existingWorker) {
      // 기존 회원 - 새 토큰 생성
      const accessToken = createToken(existingWorker.id);
      const refreshToken = 'mock-refresh-' + existingWorker.id + '-' + Date.now();

      console.log(`  기존 회원 로그인: ${existingWorker.name}`);
      return res.json({
        verified: true,
        isRegistered: true,
        workerId: existingWorker.id,
        status: existingWorker.status,
        accessToken,
        refreshToken,
      });
    }

    // 시나리오 3: 신규 회원 (그 외 모든 번호)
    console.log('  신규 회원');
    return res.json({
      verified: true,
      isRegistered: false,
      preRegisteredData: null,
    });
  }

  // 잘못된 인증번호
  return res.status(400).json({
    code: 'INVALID_CODE',
    message: '인증번호가 일치하지 않습니다.',
    userMessage: '인증번호를 다시 확인해주세요.',
  });
});

/**
 * 팀 목록 조회
 * GET /sites/:siteId/teams
 */
app.get('/sites/:siteId/teams', (req, res) => {
  const { siteId } = req.params;

  console.log(`  팀 목록 조회: ${siteId}`);

  // 테스트 팀 데이터
  const teams = [
    { id: 'team-001', name: '생산 1팀', siteId },
    { id: 'team-002', name: '생산 2팀', siteId },
    { id: 'team-003', name: '품질관리팀', siteId },
    { id: 'team-004', name: '협력업체 A', siteId },
  ];

  return res.json(teams);
});

/**
 * 근로자 등록
 * POST /auth/register-worker
 */
app.post('/auth/register-worker', (req, res) => {
  const {
    siteId,
    teamId,
    phoneNumber,
    name,
    birthDate,
    gender,
    nationality,
    jobTitle,
    signatureBase64,
    agreedTerms,
  } = req.body;

  console.log(`  근로자 등록: ${name} (${phoneNumber})`);

  // 새 근로자 생성 (출퇴근 상태 포함)
  const workerId = 'worker-' + Date.now();
  const worker = {
    id: workerId,
    siteId,
    teamId,
    phoneNumber,
    name,
    birthDate,
    gender,
    nationality,
    jobTitle,
    status: 'REQUESTED', // 승인 대기 상태
    commuteStatus: 'WORK_OFF', // 출퇴근 상태 (사용자별)
    checkInTime: null,
    checkOutTime: null,
    createdAt: new Date().toISOString(),
  };

  // 저장
  storage.workers[workerId] = worker;

  // 토큰 생성
  const accessToken = createToken(workerId);
  const refreshToken = 'mock-refresh-' + workerId + '-' + Date.now();

  console.log(`  등록 완료: ${workerId} (상태: REQUESTED)`);

  return res.json({
    success: true,
    workerId,
    status: 'REQUESTED',
    accessToken,
    refreshToken,
  });
});

/**
 * 승인 상태 확인
 * GET /auth/worker-status/:workerId
 */
app.get('/auth/worker-status/:workerId', (req, res) => {
  const { workerId } = req.params;

  const worker = storage.workers[workerId];

  if (!worker) {
    // 테스트용: 워커가 없으면 ACTIVE로 응답
    return res.json({ status: 'ACTIVE' });
  }

  console.log(`  상태 확인: ${workerId} -> ${worker.status}`);

  return res.json({ status: worker.status });
});

// ==================== 근로자 API ====================

/**
 * 내 정보 조회
 * GET /worker/me
 */
app.get('/worker/me', (req, res) => {
  const workerId = getWorkerIdFromToken(req);

  console.log(`  내 정보 조회: ${workerId || '(토큰 없음)'}`);

  // 토큰으로 사용자 찾기
  if (workerId && storage.workers[workerId]) {
    const worker = storage.workers[workerId];
    return res.json({
      ...worker,
      commuteStatus: worker.commuteStatus || 'WORK_OFF',
      checkInTime: worker.checkInTime,
    });
  }

  // 토큰이 없거나 사용자를 찾을 수 없는 경우 - 가장 최근 등록된 근로자 반환
  const workers = Object.values(storage.workers);
  const worker = workers[workers.length - 1];

  if (worker) {
    return res.json({
      ...worker,
      commuteStatus: worker.commuteStatus || 'WORK_OFF',
      checkInTime: worker.checkInTime,
    });
  }

  // 아무 근로자도 없는 경우
  return res.json({
    id: 'worker-test',
    name: '테스트 근로자',
    phoneNumber: '01012345678',
    status: 'ACTIVE',
    commuteStatus: 'WORK_OFF',
    checkInTime: null,
  });
});

/**
 * 출근 처리
 * POST /worker/commute-in
 */
app.post('/worker/commute-in', (req, res) => {
  const workerId = getWorkerIdFromToken(req);

  console.log(`  출근 처리: ${workerId || '(토큰 없음)'}`);

  const checkInTime = new Date().toISOString();

  // 해당 사용자의 출퇴근 상태 업데이트
  if (workerId && storage.workers[workerId]) {
    storage.workers[workerId].commuteStatus = 'WORK_ON';
    storage.workers[workerId].checkInTime = checkInTime;
    storage.workers[workerId].checkOutTime = null;
    console.log(`  ${storage.workers[workerId].name} 출근 완료`);
  }

  return res.json({
    success: true,
    checkInTime,
    commuteStatus: 'WORK_ON',
  });
});

/**
 * 퇴근 처리
 * POST /worker/commute-out
 */
app.post('/worker/commute-out', (req, res) => {
  const workerId = getWorkerIdFromToken(req);

  console.log(`  퇴근 처리: ${workerId || '(토큰 없음)'}`);

  const checkOutTime = new Date().toISOString();
  let workDuration = 0;

  // 해당 사용자의 출퇴근 상태 업데이트
  if (workerId && storage.workers[workerId]) {
    const worker = storage.workers[workerId];

    // 근무시간 계산 (분)
    if (worker.checkInTime) {
      const checkIn = new Date(worker.checkInTime);
      const checkOut = new Date(checkOutTime);
      workDuration = Math.floor((checkOut - checkIn) / 60000);
    }

    worker.commuteStatus = 'WORK_DONE';
    worker.checkOutTime = checkOutTime;
    console.log(`  ${worker.name} 퇴근 완료 (근무시간: ${workDuration}분)`);
  }

  return res.json({
    success: true,
    checkOutTime,
    workDuration,
    commuteStatus: 'WORK_DONE',
  });
});

/**
 * 오늘의 출퇴근 상태 조회
 * GET /worker/today-commute
 */
app.get('/worker/today-commute', (req, res) => {
  const workerId = getWorkerIdFromToken(req);

  if (workerId && storage.workers[workerId]) {
    const worker = storage.workers[workerId];
    return res.json({
      status: worker.commuteStatus || 'WORK_OFF',
      checkInTime: worker.checkInTime,
      checkOutTime: worker.checkOutTime,
    });
  }

  return res.json({
    status: 'WORK_OFF',
  });
});

// ==================== 관리자용 API (테스트) ====================

/**
 * 근로자 승인 (테스트용)
 * POST /admin/approve-worker/:workerId
 */
app.post('/admin/approve-worker/:workerId', (req, res) => {
  const { workerId } = req.params;

  if (storage.workers[workerId]) {
    storage.workers[workerId].status = 'ACTIVE';
    console.log(`  근로자 승인: ${workerId}`);
    return res.json({ success: true, status: 'ACTIVE' });
  }

  return res.status(404).json({ error: 'Worker not found' });
});

/**
 * 특정 사용자 출퇴근 상태 초기화 (테스트용)
 * POST /admin/reset-commute/:workerId
 */
app.post('/admin/reset-commute/:workerId', (req, res) => {
  const { workerId } = req.params;

  if (storage.workers[workerId]) {
    storage.workers[workerId].commuteStatus = 'WORK_OFF';
    storage.workers[workerId].checkInTime = null;
    storage.workers[workerId].checkOutTime = null;
    console.log(`  출퇴근 상태 초기화: ${workerId}`);
    return res.json({ success: true });
  }

  return res.status(404).json({ error: 'Worker not found' });
});

/**
 * 전체 출퇴근 상태 초기화 (테스트용)
 * POST /admin/reset-commute
 */
app.post('/admin/reset-commute', (req, res) => {
  Object.values(storage.workers).forEach(worker => {
    worker.commuteStatus = 'WORK_OFF';
    worker.checkInTime = null;
    worker.checkOutTime = null;
  });
  console.log('  전체 출퇴근 상태 초기화');
  return res.json({ success: true });
});

/**
 * 전체 데이터 조회 (테스트용)
 * GET /admin/data
 */
app.get('/admin/data', (req, res) => {
  return res.json(storage);
});

/**
 * 전체 데이터 초기화 (테스트용)
 * POST /admin/reset-all
 */
app.post('/admin/reset-all', (req, res) => {
  storage.workers = {};
  storage.smsRequests = {};
  storage.tokens = {};
  console.log('  전체 데이터 초기화');
  return res.json({ success: true });
});

// ==================== 서버 시작 ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('  TongPass Mock API Server (v3 - 테스트 시나리오)');
  console.log('='.repeat(50));
  console.log('');
  console.log(`  서버 주소: http://0.0.0.0:${PORT}`);
  console.log('');
  console.log('  기본 테스트 정보:');
  console.log(`    - 회사코드: ${TEST_COMPANY_CODE}`);
  console.log(`    - SMS 인증번호: ${TEST_SMS_CODE}`);
  console.log('');
  console.log('  테스트 시나리오 (전화번호):');
  console.log(`    - ${EXISTING_MEMBER_PHONE}: 기존 회원 (바로 로그인)`);
  console.log(`    - ${PRE_REGISTERED_PHONE}: 선등록 사용자 (Pre-fill)`);
  console.log('    - 그 외: 신규 회원 (일반 가입 플로우)');
  console.log('');
  console.log('  관리자 API:');
  console.log('    - POST /admin/approve-worker/:workerId (승인)');
  console.log('    - POST /admin/reset-commute/:workerId (개별 초기화)');
  console.log('    - POST /admin/reset-commute (전체 초기화)');
  console.log('    - POST /admin/reset-all (모든 데이터 초기화)');
  console.log('    - GET /admin/data (전체 데이터)');
  console.log('');
  console.log('='.repeat(50));
  console.log('');
});
