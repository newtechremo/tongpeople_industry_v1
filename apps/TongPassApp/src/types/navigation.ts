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
  CompanyCode: undefined;
  PhoneVerify: {companyId: string; siteId: string};
  WorkerInfo: {
    companyId: string;
    siteId: string;
    phoneNumber: string;
    preRegisteredData?: PreRegisteredData;
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
  Waiting: undefined;
};

// 메인 스택
export type MainStackParamList = {
  Home: undefined;
};

// 루트 스택
export type RootStackParamList = {
  Auth: undefined;
  Waiting: undefined;
  Main: undefined;
};

// 스크린 Props 타입
export type CompanyCodeScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'CompanyCode'
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
export type WaitingScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Waiting'
>;
export type HomeScreenProps = NativeStackScreenProps<
  MainStackParamList,
  'Home'
>;
