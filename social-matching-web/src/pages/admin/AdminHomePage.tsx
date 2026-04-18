import { Navigate } from 'react-router-dom';

/** Backward-compatible entry: `/admin` → operator events list. */
export function AdminHomePage() {
  return <Navigate to="/admin/events" replace />;
}
