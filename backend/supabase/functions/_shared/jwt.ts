// JWT 토큰 생성 및 검증 유틸리티
import * as jwt from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 환경 변수
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-jwt-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRES = 60 * 60; // 1시간 (초)
const REFRESH_TOKEN_EXPIRES = 60 * 60 * 24 * 30; // 30일 (초)

// JWT 키 생성
async function getJwtKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// 액세스 토큰 생성
export async function generateAccessToken(userId: string): Promise<string> {
  const key = await getJwtKey();
  const now = Math.floor(Date.now() / 1000);

  return await jwt.create(
    { alg: 'HS256', typ: 'JWT' },
    {
      sub: userId,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRES,
      type: 'access',
    },
    key
  );
}

// 리프레시 토큰 생성 (UUID)
export function generateRefreshToken(): string {
  return crypto.randomUUID();
}

// 토큰 쌍 생성 및 DB 저장
export async function generateTokens(
  userId: string,
  supabase: ReturnType<typeof createClient>,
  deviceInfo?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await generateAccessToken(userId);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES * 1000);

  // 리프레시 토큰 DB에 저장
  await supabase.from('refresh_tokens').insert({
    user_id: userId,
    token: refreshToken,
    device_info: deviceInfo,
    expires_at: expiresAt.toISOString(),
  });

  return { accessToken, refreshToken };
}

// 액세스 토큰 검증
export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const key = await getJwtKey();
    const payload = await jwt.verify(token, key);

    if (payload.type !== 'access') {
      return null;
    }

    return payload.sub as string;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Authorization 헤더에서 토큰 추출 및 검증
export async function verifyAuthHeader(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  return await verifyAccessToken(token);
}

// 리프레시 토큰으로 새 액세스 토큰 발급
export async function refreshAccessToken(
  refreshToken: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ accessToken: string; userId: string } | null> {
  // 리프레시 토큰 조회
  const { data: tokenData, error } = await supabase
    .from('refresh_tokens')
    .select('user_id, expires_at, revoked_at')
    .eq('token', refreshToken)
    .single();

  if (error || !tokenData) {
    return null;
  }

  // 만료 또는 폐기 확인
  if (tokenData.revoked_at || new Date(tokenData.expires_at) < new Date()) {
    return null;
  }

  // 새 액세스 토큰 생성
  const accessToken = await generateAccessToken(tokenData.user_id);

  return { accessToken, userId: tokenData.user_id };
}

// 리프레시 토큰 폐기 (로그아웃)
export async function revokeRefreshToken(
  refreshToken: string,
  supabase: ReturnType<typeof createClient>
): Promise<boolean> {
  const { error } = await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token', refreshToken);

  return !error;
}

// 사용자의 모든 리프레시 토큰 폐기 (모든 기기 로그아웃)
export async function revokeAllUserTokens(
  userId: string,
  supabase: ReturnType<typeof createClient>
): Promise<boolean> {
  const { error } = await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null);

  return !error;
}
