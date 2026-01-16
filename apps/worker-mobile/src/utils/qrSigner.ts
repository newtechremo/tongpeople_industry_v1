/**
 * QR 코드 서명 생성 유틸리티
 *
 * HMAC-SHA256 기반 서명으로 QR 코드 위변조를 방지합니다.
 */
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

export interface QRPayload {
  workerId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
}

// 환경변수에서 시크릿 키 가져오기
const QR_SECRET_KEY =
  Constants.expoConfig?.extra?.qrSecretKey ||
  process.env.EXPO_PUBLIC_QR_SECRET_KEY ||
  '';

/**
 * 서명된 QR 페이로드 생성
 *
 * @param workerId 근로자 ID (user.id)
 * @param validityMs 유효 시간 (밀리초), 기본 30초
 * @returns 서명이 포함된 QR 페이로드
 */
export async function generateSignedQR(
  workerId: string,
  validityMs: number = 30000
): Promise<QRPayload> {
  const timestamp = Date.now();
  const expiresAt = timestamp + validityMs;

  // 서명할 메시지 생성 (순서 중요!)
  const message = JSON.stringify({ workerId, timestamp, expiresAt });

  // HMAC-SHA256 서명 생성
  const signature = await createHmacSignature(message);

  return {
    workerId,
    timestamp,
    expiresAt,
    signature,
  };
}

/**
 * HMAC-SHA256 서명 생성
 *
 * expo-crypto는 HMAC을 직접 지원하지 않으므로,
 * message + secret을 연결하여 해시를 생성합니다.
 */
async function createHmacSignature(message: string): Promise<string> {
  // 키가 없으면 개발 모드로 간주하고 더미 서명 반환
  if (!QR_SECRET_KEY) {
    console.warn('[QR Signer] QR_SECRET_KEY가 설정되지 않았습니다. 개발 모드로 동작합니다.');
    return 'dev-signature-' + Date.now().toString(36);
  }

  // message + key 조합으로 해시 생성
  const combined = message + QR_SECRET_KEY;

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );

  return hash;
}

/**
 * QR 페이로드를 JSON 문자열로 변환
 */
export function stringifyQRPayload(payload: QRPayload): string {
  return JSON.stringify(payload);
}

/**
 * QR 페이로드 유효성 검사 (클라이언트 사이드)
 *
 * 만료 여부만 확인합니다. 서명 검증은 서버에서 수행합니다.
 */
export function isQRPayloadValid(payload: QRPayload): boolean {
  const now = Date.now();
  return now < payload.expiresAt;
}

/**
 * QR 페이로드 남은 시간 (초)
 */
export function getQRRemainingSeconds(payload: QRPayload): number {
  const now = Date.now();
  const remaining = Math.max(0, payload.expiresAt - now);
  return Math.ceil(remaining / 1000);
}
