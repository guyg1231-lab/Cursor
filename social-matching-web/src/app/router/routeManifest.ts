/**
 * Route inventory metadata (documentation + audits). Not consumed by runtime guards today.
 *
 * **Auth tier semantics**
 * - `public` — no session required; page is useful for anonymous visitors.
 * - `preview` — reachable without a session, but full functionality expects a signed-in user
 *   (page shows graceful empty/login states for anon). Same routing behavior as `public` in
 *   `AppRouter`; the tier documents intent for readers of this file.
 * - `protected` — requires auth; unauthenticated users are redirected by route guards.
 * - `admin` — operator/admin surfaces (`AdminRoute`).
 */
export type Workstream = 'shared' | 'participant' | 'host' | 'admin';
export type RouteDataStatus = 'real' | 'mixed' | 'stubbed';
export type RouteClassification =
  | 'Existing and keep'
  | 'Existing but normalize'
  | 'Existing but expand'
  | 'Add placeholder now'
  | 'Later, no route yet';

export type RouteSupportedState =
  | 'loading'
  | 'empty'
  | 'error'
  | 'not_found'
  | 'gated'
  | 'unavailable'
  | 'success';

export type RouteManifestEntry = {
  path: string;
  workstream: Workstream;
  auth: 'public' | 'preview' | 'protected' | 'admin';
  dataStatus: RouteDataStatus;
  classification: RouteClassification;
  supportedStates: RouteSupportedState[];
  nextSteps: string[];
};

export const routeManifest: RouteManifestEntry[] = [
  {
    path: '/',
    workstream: 'participant',
    auth: 'public',
    dataStatus: 'real',
    classification: 'Existing and keep',
    supportedStates: ['success'],
    nextSteps: ['/events', '/questionnaire'],
  },
  {
    path: '/auth',
    workstream: 'participant',
    auth: 'public',
    dataStatus: 'real',
    classification: 'Existing and keep',
    supportedStates: ['loading', 'error', 'success'],
    nextSteps: ['/auth/callback'],
  },
  {
    path: '/sign-in',
    workstream: 'participant',
    auth: 'public',
    dataStatus: 'real',
    classification: 'Existing and keep',
    supportedStates: ['loading', 'error', 'success'],
    nextSteps: ['/auth/callback'],
  },
  {
    path: '/auth/callback',
    workstream: 'participant',
    auth: 'preview',
    dataStatus: 'real',
    classification: 'Existing and keep',
    supportedStates: ['loading', 'error', 'success'],
    nextSteps: ['/dashboard'],
  },
  {
    path: '/events',
    workstream: 'participant',
    auth: 'public',
    dataStatus: 'real',
    classification: 'Existing but normalize',
    supportedStates: ['loading', 'empty', 'error', 'success'],
    nextSteps: ['/events/:eventId'],
  },
  {
    path: '/events/:eventId',
    workstream: 'participant',
    auth: 'public',
    dataStatus: 'real',
    classification: 'Existing but expand',
    supportedStates: ['loading', 'error', 'not_found', 'success'],
    nextSteps: ['/events/:eventId/apply', '/events'],
  },
  {
    path: '/events/:eventId/apply',
    workstream: 'participant',
    auth: 'protected',
    dataStatus: 'real',
    classification: 'Existing but expand',
    supportedStates: ['loading', 'error', 'gated', 'unavailable', 'success'],
    nextSteps: ['/dashboard', '/questionnaire'],
  },
  {
    path: '/questionnaire',
    workstream: 'participant',
    auth: 'preview',
    dataStatus: 'real',
    classification: 'Existing and keep',
    supportedStates: ['loading', 'error', 'success'],
    nextSteps: ['/events', '/dashboard'],
  },
  {
    path: '/dashboard',
    workstream: 'participant',
    auth: 'protected',
    dataStatus: 'real',
    classification: 'Existing but expand',
    supportedStates: ['loading', 'empty', 'error', 'success'],
    nextSteps: ['/questionnaire', '/events'],
  },
  {
    path: '/gathering/:eventId',
    workstream: 'participant',
    auth: 'public',
    dataStatus: 'real',
    classification: 'Existing but normalize',
    supportedStates: ['loading', 'error', 'not_found', 'success'],
    nextSteps: ['/events/:eventId', '/dashboard'],
  },
  {
    path: '/host/events',
    workstream: 'host',
    auth: 'protected',
    dataStatus: 'real',
    classification: 'Existing but expand',
    supportedStates: ['loading', 'empty', 'error', 'success'],
    nextSteps: ['/host/events/:eventId'],
  },
  {
    path: '/host/events/:eventId',
    workstream: 'host',
    auth: 'protected',
    dataStatus: 'stubbed',
    classification: 'Add placeholder now',
    supportedStates: ['loading', 'error', 'unavailable', 'success'],
    nextSteps: [
      '/host/events/:eventId/registrations',
      '/host/events/:eventId/communications',
      '/host/events/:eventId/follow-up',
    ],
  },
  {
    path: '/host/events/:eventId/registrations',
    workstream: 'host',
    auth: 'protected',
    dataStatus: 'stubbed',
    classification: 'Add placeholder now',
    supportedStates: ['loading', 'empty', 'error', 'unavailable', 'success'],
    nextSteps: ['/host/events/:eventId'],
  },
  {
    path: '/host/events/:eventId/communications',
    workstream: 'host',
    auth: 'protected',
    dataStatus: 'stubbed',
    classification: 'Add placeholder now',
    supportedStates: ['loading', 'empty', 'error', 'unavailable', 'success'],
    nextSteps: ['/host/events/:eventId'],
  },
  {
    path: '/host/events/:eventId/follow-up',
    workstream: 'host',
    auth: 'protected',
    dataStatus: 'stubbed',
    classification: 'Add placeholder now',
    supportedStates: ['loading', 'empty', 'error', 'unavailable', 'success'],
    nextSteps: ['/host/events/:eventId'],
  },
  {
    path: '/admin',
    workstream: 'admin',
    auth: 'admin',
    dataStatus: 'real',
    classification: 'Existing and keep',
    supportedStates: ['loading', 'gated', 'success'],
    nextSteps: ['/admin/events'],
  },
  {
    path: '/admin/events',
    workstream: 'admin',
    auth: 'admin',
    dataStatus: 'real',
    classification: 'Existing and keep',
    supportedStates: ['loading', 'empty', 'error', 'success'],
    nextSteps: ['/admin/events/new', '/admin/events/:eventId'],
  },
  {
    path: '/admin/event-requests',
    workstream: 'admin',
    auth: 'admin',
    dataStatus: 'real',
    classification: 'Existing but expand',
    supportedStates: ['loading', 'empty', 'error', 'success'],
    nextSteps: ['/admin/events/:eventId', '/admin/events'],
  },
  {
    path: '/admin/events/new',
    workstream: 'admin',
    auth: 'admin',
    dataStatus: 'real',
    classification: 'Existing and keep',
    supportedStates: ['loading', 'error', 'success'],
    nextSteps: ['/admin/events/:eventId'],
  },
  {
    path: '/admin/events/:eventId',
    workstream: 'admin',
    auth: 'admin',
    dataStatus: 'real',
    classification: 'Existing but expand',
    supportedStates: ['loading', 'error', 'not_found', 'success'],
    nextSteps: [
      '/admin/events/:eventId/diagnostics',
      '/admin/events/:eventId/audit',
      '/team/gathering/:eventId',
    ],
  },
  {
    path: '/team/gathering/:eventId',
    workstream: 'admin',
    auth: 'admin',
    dataStatus: 'real',
    classification: 'Existing and keep',
    supportedStates: ['loading', 'error', 'not_found', 'success'],
    nextSteps: ['/admin/events/:eventId'],
  },
  {
    path: '/admin/events/:eventId/diagnostics',
    workstream: 'admin',
    auth: 'admin',
    dataStatus: 'stubbed',
    classification: 'Add placeholder now',
    supportedStates: ['loading', 'error', 'unavailable', 'success'],
    nextSteps: ['/admin/events/:eventId'],
  },
  {
    path: '/admin/events/:eventId/audit',
    workstream: 'admin',
    auth: 'admin',
    dataStatus: 'stubbed',
    classification: 'Add placeholder now',
    supportedStates: ['loading', 'error', 'unavailable', 'success'],
    nextSteps: ['/admin/events/:eventId'],
  },
];
