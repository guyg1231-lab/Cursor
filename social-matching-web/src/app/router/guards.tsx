import type { PropsWithChildren } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { RouteGatedState, RouteLoadingState } from '@/components/shared/RouteState';
import { Button } from '@/components/ui/button';
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
  const location = useLocation();

  if (isLoading) {
    return <RouteLoadingState />;
  }

  if (!user) {
    const attemptedPath = parseSafeReturnTo(`${location.pathname}${location.search}`);
    storePostAuthReturnTo(attemptedPath);
    return <Navigate to={buildAuthPath(attemptedPath)} replace />;
  }

  if (!isAdmin) {
    return (
      <RouteGatedState
        title="אין לך גישה לעמוד הזה"
        body="העמוד הזה זמין רק לצוות התפעול."
        action={
          <Button asChild variant="outline">
            <Link to="/">חזרה לדף הבית</Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
