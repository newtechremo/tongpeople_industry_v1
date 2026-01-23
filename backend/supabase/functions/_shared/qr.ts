// QR 코드 페이로드 생성 유틸리티

const QR_SECRET = Deno.env.get('QR_SECRET') || 'your-qr-secret-key-change-in-production';
const QR_VALIDITY_SECONDS = 30; // QR 코드 유효 시간 (초)

/**
 * HMAC-SHA256 서명 생성
 */
async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // ArrayBuffer를 hex 문자열로 변환
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * QR 페이로드 생성
 * @param workerId 근로자 ID
 * @returns QR 페이로드 데이터
 */
export async function generateQrPayload(workerId: string): Promise<{
  workerId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
  expiresInSeconds: number;
}> {
  const timestamp = Date.now();
  const expiresAt = timestamp + QR_VALIDITY_SECONDS * 1000;

  // 서명 생성: workerId:timestamp:expiresAt
  const payload = `${workerId}:${timestamp}:${expiresAt}`;
  const signature = await hmacSign(payload, QR_SECRET);

  return {
    workerId,
    timestamp,
    expiresAt,
    signature,
    expiresInSeconds: QR_VALIDITY_SECONDS,
  };
}

/**
 * QR 페이로드 검증
 * @param workerId 근로자 ID
 * @param timestamp 타임스탬프
 * @param expiresAt 만료 시간
 * @param signature 서명
 * @returns 검증 결과
 */
export async function verifyQrPayload(
  workerId: string,
  timestamp: number,
  expiresAt: number,
  signature: string
): Promise<boolean> {
  // 만료 확인
  if (Date.now() > expiresAt) {
    return false;
  }

  // 서명 검증
  const payload = `${workerId}:${timestamp}:${expiresAt}`;
  const expectedSignature = await hmacSign(payload, QR_SECRET);

  return signature === expectedSignature;
}
