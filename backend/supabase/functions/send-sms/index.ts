// SMS 인증코드 발송 Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.208.0/encoding/base64.ts';
import { handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';

interface SendSmsRequest {
  phone: string;
  purpose: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET';
}

// 네이버 클라우드 SENS API 시그니처 생성
async function makeSignature(
  method: string,
  uri: string,
  timestamp: string,
  accessKey: string,
  secretKey: string
): Promise<string> {
  const message = `${method} ${uri}\n${timestamp}\n${accessKey}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return base64Encode(new Uint8Array(signature));
}

// 네이버 클라우드 SENS SMS 발송
async function sendSmsViaNCP(
  phone: string,
  code: string,
  serviceId: string,
  accessKey: string,
  secretKey: string,
  sendNumber: string
): Promise<{ success: boolean; error?: string }> {
  const timestamp = Date.now().toString();
  const uri = `/sms/v2/services/${serviceId}/messages`;
  const url = `https://sens.apigw.ntruss.com${uri}`;

  const signature = await makeSignature('POST', uri, timestamp, accessKey, secretKey);

  const body = {
    type: 'SMS',
    from: sendNumber,
    content: `[통패스] 인증번호 [${code}]를 입력해주세요.`,
    messages: [{ to: phone }],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': accessKey,
        'x-ncp-apigw-signature-v2': signature,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (response.ok && result.statusCode === '202') {
      console.log('[SENS] SMS 발송 성공:', result.requestId);
      return { success: true };
    } else {
      console.error('[SENS] SMS 발송 실패:', result);
      return { success: false, error: result.statusMessage || 'SMS 발송 실패' };
    }
  } catch (error) {
    console.error('[SENS] API 호출 오류:', error);
    return { success: false, error: '네트워크 오류' };
  }
}

// 6자리 인증코드 생성
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 전화번호 정규화 (숫자만 추출)
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

Deno.serve(async (req) => {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { phone, purpose }: SendSmsRequest = await req.json();

    // 1. 전화번호 유효성 검사
    const normalizedPhone = normalizePhone(phone);
    if (!/^01[0-9]{8,9}$/.test(normalizedPhone)) {
      return errorResponse('INVALID_PHONE_NUMBER', '올바른 휴대폰 번호를 입력해주세요.');
    }

    // 2. 목적별 검증
    if (purpose === 'SIGNUP') {
      // 회원가입: 이미 등록된 번호인지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();

      if (existingUser) {
        return errorResponse('DUPLICATE_PHONE', '이미 가입된 휴대폰 번호입니다.');
      }
    } else if (purpose === 'LOGIN' || purpose === 'PASSWORD_RESET') {
      // 로그인/비밀번호 재설정: 등록된 번호인지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();

      if (!existingUser) {
        return errorResponse('USER_NOT_FOUND', '등록되지 않은 휴대폰 번호입니다.', 404);
      }
    }

    // 3. 기존 미사용 인증코드 무효화
    await supabase
      .from('sms_verifications')
      .delete()
      .eq('phone', normalizedPhone)
      .eq('purpose', purpose)
      .eq('verified', false);

    // 4. 새 인증코드 생성
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3분 후 만료

    // 5. DB에 저장
    const { error: insertError } = await supabase
      .from('sms_verifications')
      .insert({
        phone: normalizedPhone,
        code: code,
        purpose: purpose,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return errorResponse('SERVER_ERROR', '인증코드 생성 중 오류가 발생했습니다.', 500);
    }

    // 6. SMS 발송 (네이버 클라우드 SENS API)
    const smsAccessKey = Deno.env.get('NCP_ACCESS_KEY');
    const smsSecretKey = Deno.env.get('NCP_SECRET_KEY');
    const smsServiceId = Deno.env.get('NCP_SMS_SERVICE_ID');
    const smsSendNumber = Deno.env.get('NCP_SMS_SEND_NUMBER');

    if (smsAccessKey && smsSecretKey && smsServiceId && smsSendNumber) {
      // 실제 SMS 발송
      const smsResult = await sendSmsViaNCP(
        normalizedPhone,
        code,
        smsServiceId,
        smsAccessKey,
        smsSecretKey,
        smsSendNumber
      );

      if (!smsResult.success) {
        console.error('[SMS] 발송 실패:', smsResult.error);
        // SMS 발송 실패해도 개발 환경에서는 계속 진행 (테스트용)
        if (Deno.env.get('ENVIRONMENT') === 'production') {
          return errorResponse('SMS_SEND_FAILED', 'SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.', 500);
        }
      }
    } else {
      // 환경변수 미설정: 콘솔에만 출력 (개발 모드)
      console.log(`[개발모드] SMS 인증코드: ${normalizedPhone} -> ${code}`);
    }

    return successResponse({
      message: '인증코드가 발송되었습니다.',
      // 개발 환경에서만 코드 반환 (프로덕션에서는 제거)
      ...(Deno.env.get('ENVIRONMENT') !== 'production' && { code }),
      expiresIn: 180, // 3분 (초)
    });
  } catch (error) {
    return serverError(error);
  }
});
