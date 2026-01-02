import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 임시 데이터 (실제로는 API에서 조회)
const companyProfile = {
  companyName: '(주)통하는사람들',
  representativeName: '홍길동',
  address: '서울특별시 강남구 테헤란로 123',
  businessNumber: '123-45-67890',
  industryCode: 'F',
  industryName: '건설업',
  timezone: 'Asia/Seoul',
  bizFileUrl: null,
  adminInfo: {
    name: '김전산',
    phone: '010-1234-5678',
    email: 'tech@tongpass.com',
  },
  billingInfo: {
    name: '이회계',
    phone: '010-9876-5432',
    email: 'billing@tongpass.com',
  },
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-3 border-b border-gray-100">
    <Text className="text-sm text-slate-500">{label}</Text>
    <Text className="text-sm font-bold text-slate-700">{value}</Text>
  </View>
);

const ContactCard = ({
  title,
  color,
  info,
}: {
  title: string;
  color: 'blue' | 'purple';
  info: { name: string; phone: string; email: string };
}) => {
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-purple-50';
  const borderColor = color === 'blue' ? 'border-blue-200' : 'border-purple-200';
  const textColor = color === 'blue' ? 'text-blue-700' : 'text-purple-700';

  return (
    <View className={`${bgColor} ${borderColor} border rounded-xl p-4 mb-3`}>
      <Text className={`text-sm font-bold ${textColor} mb-3`}>{title}</Text>
      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-xs text-slate-500">이름</Text>
          <Text className="text-sm font-medium text-slate-700">{info.name || '-'}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-slate-500">연락처</Text>
          <TouchableOpacity onPress={() => info.phone && Linking.openURL(`tel:${info.phone}`)}>
            <Text className="text-sm font-medium text-blue-600">{info.phone || '-'}</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-slate-500">이메일</Text>
          <TouchableOpacity onPress={() => info.email && Linking.openURL(`mailto:${info.email}`)}>
            <Text className="text-sm font-medium text-blue-600">{info.email || '-'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 py-4">
        {/* 회사 기본 정보 */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 items-center justify-center mr-3"
                  style={{ backgroundColor: '#F97316' }}>
              <Text className="text-white text-xl font-black">통</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-black text-slate-800">
                {companyProfile.companyName}
              </Text>
              <Text className="text-sm text-slate-500">
                대표: {companyProfile.representativeName}
              </Text>
            </View>
          </View>

          <View className="border-t border-gray-100 pt-3">
            <InfoRow label="사업자등록번호" value={companyProfile.businessNumber} />
            <InfoRow
              label="대표 업종"
              value={`[${companyProfile.industryCode}] ${companyProfile.industryName}`}
            />
            <InfoRow label="본사 주소" value={companyProfile.address} />
            <InfoRow label="시간대" value="한국 표준시 (UTC+9)" />
          </View>
        </View>

        {/* 사업자등록증 */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-sm font-bold text-slate-700 mb-3">사업자 등록증</Text>
          {companyProfile.bizFileUrl ? (
            <TouchableOpacity
              className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex-row items-center"
              onPress={() => {/* 파일 보기 */}}
            >
              <View className="w-10 h-10 bg-orange-100 rounded-lg items-center justify-center mr-3">
                <Text className="text-orange-600 text-lg">📄</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-700">사업자등록증.pdf</Text>
                <Text className="text-xs text-slate-400">탭하여 보기</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 items-center">
              <Text className="text-sm text-slate-400">등록된 파일이 없습니다</Text>
            </View>
          )}
        </View>

        {/* 담당자 정보 */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-sm font-bold text-slate-700 mb-3">담당자 정보</Text>
          <ContactCard
            title="전산 관리자"
            color="blue"
            info={companyProfile.adminInfo}
          />
          <ContactCard
            title="결제 담당자"
            color="purple"
            info={companyProfile.billingInfo}
          />
        </View>

        {/* 안내 문구 */}
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <Text className="text-xs text-amber-700 text-center leading-5">
            회사 정보 수정은 관리자 웹에서만 가능합니다.{'\n'}
            수정이 필요한 경우 담당자에게 문의해주세요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
