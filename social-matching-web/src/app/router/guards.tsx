import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RouteLoadingState } from '@/components/shared/RouteState';
import { useAuth } from '@/contexts/AuthContext';
import { buildAuthPath, parseSafeReturnTo, storePostAuthReturnTo } from '@/lib/authReturnTo';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <RouteLoadingState />;
  }

  if (!user) {
    const attemptedPath = parseSafeReturnTo(`${location.pathname}${location.search}`);
    storePostAuthReturnTo(attemptedPath);
    return <Navigate to={buildAuthPath(attemptedPath)} replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: PropsWithChildren) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoadingState />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
