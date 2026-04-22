import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from '@/pages/landing/LandingPage';
import { CommunityGuidelinesPage } from '@/pages/legal/CommunityGuidelinesPage';
import { PrivacyPage } from '@/pages/legal/PrivacyPage';
import { TermsPage } from '@/pages/legal/TermsPage';
import { EventsPage } from '@/pages/events/EventsPage';
import { EventDetailPage } from '@/pages/events/EventDetailPage';
import { QuestionnairePage } from '@/pages/questionnaire/QuestionnairePage';
import { ApplyPage } from '@/pages/apply/ApplyPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { AdminEventRequestsPage } from '@/pages/admin/AdminEventRequestsPage';
import { AdminHomePage } from '@/pages/admin/AdminHomePage';
import { OperatorEventCreatePage } from '@/pages/admin/OperatorEventCreatePage';
import { OperatorEventDashboardPage } from '@/pages/admin/OperatorEventDashboardPage';
import { OperatorEventsListPage } from '@/pages/admin/OperatorEventsListPage';
import { TeamGatheringPage } from '@/pages/admin/TeamGatheringPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage';
import { GatheringPage } from '@/pages/gathering/GatheringPage';
import { EventProposalPage, HostEventsPage } from '@/pages/host/HostEventsPage';
import { HostEventWorkspacePage } from '@/pages/host/HostEventWorkspacePage';
import { HostEventRegistrationsPage } from '@/pages/host/HostEventRegistrationsPage';
import { HostEventCommunicationsPage } from '@/pages/host/HostEventCommunicationsPage';
import { HostEventFollowUpPage } from '@/pages/host/HostEventFollowUpPage';
import { OperatorEventDiagnosticsPage } from '@/pages/admin/OperatorEventDiagnosticsPage';
import { OperatorEventAuditPage } from '@/pages/admin/OperatorEventAuditPage';
import { AdminRoute, ProtectedRoute } from '@/app/router/guards';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/guidelines" element={<CommunityGuidelinesPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/sign-in" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/gathering/:eventId" element={<GatheringPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route
        path="/events/propose"
        element={
          <ProtectedRoute>
            <EventProposalPage />
          </ProtectedRoute>
        }
      />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route
        path="/events/:eventId/apply"
        element={
          <ProtectedRoute>
            <ApplyPage />
          </ProtectedRoute>
        }
      />
      <Route path="/questionnaire" element={<QuestionnairePage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/events"
        element={
          <ProtectedRoute>
            <HostEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/events/:eventId/registrations"
        element={
          <ProtectedRoute>
            <HostEventRegistrationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/events/:eventId/communications"
        element={
          <ProtectedRoute>
            <HostEventCommunicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/events/:eventId/follow-up"
        element={
          <ProtectedRoute>
            <HostEventFollowUpPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/events/:eventId"
        element={
          <ProtectedRoute>
            <HostEventWorkspacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminHomePage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <AdminRoute>
            <OperatorEventsListPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/event-requests"
        element={
          <AdminRoute>
            <AdminEventRequestsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/new"
        element={
          <AdminRoute>
            <OperatorEventCreatePage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/:eventId/diagnostics"
        element={
          <AdminRoute>
            <OperatorEventDiagnosticsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/:eventId/audit"
        element={
          <AdminRoute>
            <OperatorEventAuditPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/:eventId"
        element={
          <AdminRoute>
            <OperatorEventDashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/team/gathering/:eventId"
        element={
          <AdminRoute>
            <TeamGatheringPage />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
