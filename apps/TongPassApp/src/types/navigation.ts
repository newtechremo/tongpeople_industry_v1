import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {PreRegisteredData} from './user';

/**
 * 근로자 등록에 필요한 기본 정보
 * WorkerInfo → Terms → Signature 화면 간 전달
 */
export interface WorkerRegistrationData {
  companyId: string;
  siteId: string;
  phoneNumber: string;
  name: string;
  birthDate: string;
  gender: 'M' | 'F';
  email?: string;
  nationality: string;
  jobTitle: string;
  teamId: string;
  isDataConflict?: boolean; // 선등록 데이터와 충돌 여부
}

// 인증 스택
export type AuthStackParamList = {
  AuthEntry: undefined;
  CompanyCode: undefined;
  SiteSelect: {
    companyId: string;
    companyName: string;
    sites: Array<{
      id: string;
      name: string;
      address: string;
    }>;
  };
  PhoneVerify: {companyId: string; siteId: string};
  WorkerInfo: {
    companyId: string;
    siteId: string;
    phoneNumber: string;
    preRegisteredData?: PreRegisteredData;

    // 이직 시나리오 추가 파라미터
    isTransfer?: boolean;
    existingUserId?: string;
  };
  Terms: {
    registrationData: WorkerRegistrationData;
  };
  TermsDetail: {
    termId: string;
    title: string;
  };
  Signature: {
    registrationData: WorkerRegistrationData;
    agreedTerms: string[];
  };
  PasswordSetup: {
    companyId: string;
    siteId: string;
    phoneNumber: string;
    preRegisteredData?: PreRegisteredData;
  };
  PasswordReset: undefined;
  Waiting: undefined;
};

// 메인 스택 (기존 - deprecated, MainTabs로 대체)
export type MainStackParamList = {
  Home: undefined;
};

// 하단 탭 네비게이션
export type MainTabParamList = {
  HomeTab: undefined;
  AttendanceTab: undefined;
  MyPageTab: undefined;
};

// 홈 스택 (탭 내부)
export type HomeStackParamList = {
  Home: undefined;
};

// 출퇴근 기록 스택 (탭 내부)
export type AttendanceStackParamList = {
  AttendanceHistory: undefined;
};

// 마이페이지 스택 (탭 내부)
export type MyPageStackParamList = {
  MyPage: undefined;
  ProfileDetail: undefined;
  Settings: undefined;
  PersonalQR: undefined;
  CompanyList: undefined;
};

// QR 스캔 스택 (팀 관리자 이상)
export type QRScanStackParamList = {
  QRScan: {
    mode?: 'CHECK_IN' | 'CHECK_OUT';
  };
  ScanSuccess: {
    workerName: string;
    teamName: string;
    checkTime: string;
    mode: 'CHECK_IN' | 'CHECK_OUT';
  };
  ScanFailure: {
    errorType:
      | 'INVALID_QR'
      | 'EXPIRED_QR'
      | 'ALREADY_CHECKED'
      | 'WORKER_NOT_FOUND'
      | 'PERMISSION_DENIED'
      | 'NETWORK_ERROR'
      | 'UNKNOWN';
    errorMessage?: string;
    mode: 'CHECK_IN' | 'CHECK_OUT';
  };
};

// 루트 스택
export type RootStackParamList = {
  Auth: undefined;
  Waiting: undefined;
  Main: undefined;
  QRScanStack: {
    mode?: 'CHECK_IN' | 'CHECK_OUT';
  };
};

// 스크린 Props 타입
export type AuthEntryScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'AuthEntry'
>;
export type CompanyCodeScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'CompanyCode'
>;
export type SiteSelectScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'SiteSelect'
>;
export type PhoneVerifyScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'PhoneVerify'
>;
export type WorkerInfoScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'WorkerInfo'
>;
export type TermsScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Terms'
>;
export type TermsDetailScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'TermsDetail'
>;
export type SignatureScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Signature'
>;
export type PasswordSetupScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'PasswordSetup'
>;
export type WaitingScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Waiting'
>;
export type HomeScreenProps = NativeStackScreenProps<
  MainStackParamList,
  'Home'
>;

// 탭 내 스크린 Props
export type AttendanceHistoryScreenProps = NativeStackScreenProps<
  AttendanceStackParamList,
  'AttendanceHistory'
>;
export type MyPageScreenProps = NativeStackScreenProps<
  MyPageStackParamList,
  'MyPage'
>;
export type ProfileDetailScreenProps = NativeStackScreenProps<
  MyPageStackParamList,
  'ProfileDetail'
>;
export type SettingsScreenProps = NativeStackScreenProps<
  MyPageStackParamList,
  'Settings'
>;
export type PersonalQRScreenProps = NativeStackScreenProps<
  MyPageStackParamList,
  'PersonalQR'
>;

// QR 스캔 스크린 Props
export type QRScanScreenProps = NativeStackScreenProps<
  QRScanStackParamList,
  'QRScan'
>;
export type ScanSuccessScreenProps = NativeStackScreenProps<
  QRScanStackParamList,
  'ScanSuccess'
>;
export type ScanFailureScreenProps = NativeStackScreenProps<
  QRScanStackParamList,
  'ScanFailure'
>;
