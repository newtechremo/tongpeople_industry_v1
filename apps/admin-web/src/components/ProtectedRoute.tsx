import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/api/auth';
import type { AuthUser } from '@/api/auth';

// Types
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AuthUser['role'];
}

// Loading Component
function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500">로딩 중...</p>
      </div>
    </div>
  );
}

// Access Denied Component
function AccessDenied() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">접근 권한 없음</h2>
        <p className="text-sm text-slate-500">
          이 페이지에 접근할 권한이 없습니다.
          <br />
          관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}

// ProtectedRoute Component
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // Hooks
  const { user, loading } = useAuth();
  const location = useLocation();

  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permission if required
  if (requiredRole && !hasPermission(user, requiredRole)) {
    return <AccessDenied />;
  }

  // Render protected content
  return <>{children}</>;
}
