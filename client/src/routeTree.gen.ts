/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as RegisterImport } from './routes/register'
import { Route as AuthenticatedNoSidebarImport } from './routes/_authenticated-no-sidebar'
import { Route as AuthenticatedImport } from './routes/_authenticated'
import { Route as IndexImport } from './routes/index'
import { Route as AuthenticatedUsersImport } from './routes/_authenticated/users'
import { Route as AuthenticatedTemplatesImport } from './routes/_authenticated/templates'
import { Route as AuthenticatedRequestsImport } from './routes/_authenticated/requests'
import { Route as AuthenticatedProgramsImport } from './routes/_authenticated/programs'
import { Route as AuthenticatedProfileImport } from './routes/_authenticated/profile'
import { Route as AuthenticatedOjtImport } from './routes/_authenticated/ojt'
import { Route as AuthenticatedDepartmentsImport } from './routes/_authenticated/departments'
import { Route as AuthenticatedDashboardImport } from './routes/_authenticated/dashboard'
import { Route as AuthenticatedCompanyImport } from './routes/_authenticated/company'
import { Route as AuthenticatedClassesImport } from './routes/_authenticated/classes'
import { Route as AuthenticatedNoSidebarAssignCoordinatorImport } from './routes/_authenticated-no-sidebar/assign-coordinator'
import { Route as AuthenticatedNoSidebarAssignCompanyImport } from './routes/_authenticated-no-sidebar/assign-company'
import { Route as AuthenticatedReportsIndexImport } from './routes/_authenticated/reports.index'
import { Route as AuthenticatedReportsDayImport } from './routes/_authenticated/reports.$day'

// Create/Update Routes

const RegisterRoute = RegisterImport.update({
  id: '/register',
  path: '/register',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedNoSidebarRoute = AuthenticatedNoSidebarImport.update({
  id: '/_authenticated-no-sidebar',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedRoute = AuthenticatedImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedUsersRoute = AuthenticatedUsersImport.update({
  id: '/users',
  path: '/users',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedTemplatesRoute = AuthenticatedTemplatesImport.update({
  id: '/templates',
  path: '/templates',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedRequestsRoute = AuthenticatedRequestsImport.update({
  id: '/requests',
  path: '/requests',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedProgramsRoute = AuthenticatedProgramsImport.update({
  id: '/programs',
  path: '/programs',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedProfileRoute = AuthenticatedProfileImport.update({
  id: '/profile',
  path: '/profile',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedOjtRoute = AuthenticatedOjtImport.update({
  id: '/ojt',
  path: '/ojt',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedDepartmentsRoute = AuthenticatedDepartmentsImport.update({
  id: '/departments',
  path: '/departments',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedDashboardRoute = AuthenticatedDashboardImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedCompanyRoute = AuthenticatedCompanyImport.update({
  id: '/company',
  path: '/company',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedClassesRoute = AuthenticatedClassesImport.update({
  id: '/classes',
  path: '/classes',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedNoSidebarAssignCoordinatorRoute =
  AuthenticatedNoSidebarAssignCoordinatorImport.update({
    id: '/assign-coordinator',
    path: '/assign-coordinator',
    getParentRoute: () => AuthenticatedNoSidebarRoute,
  } as any)

const AuthenticatedNoSidebarAssignCompanyRoute =
  AuthenticatedNoSidebarAssignCompanyImport.update({
    id: '/assign-company',
    path: '/assign-company',
    getParentRoute: () => AuthenticatedNoSidebarRoute,
  } as any)

const AuthenticatedReportsIndexRoute = AuthenticatedReportsIndexImport.update({
  id: '/reports/',
  path: '/reports/',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedReportsDayRoute = AuthenticatedReportsDayImport.update({
  id: '/reports/$day',
  path: '/reports/$day',
  getParentRoute: () => AuthenticatedRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthenticatedImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated-no-sidebar': {
      id: '/_authenticated-no-sidebar'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthenticatedNoSidebarImport
      parentRoute: typeof rootRoute
    }
    '/register': {
      id: '/register'
      path: '/register'
      fullPath: '/register'
      preLoaderRoute: typeof RegisterImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated-no-sidebar/assign-company': {
      id: '/_authenticated-no-sidebar/assign-company'
      path: '/assign-company'
      fullPath: '/assign-company'
      preLoaderRoute: typeof AuthenticatedNoSidebarAssignCompanyImport
      parentRoute: typeof AuthenticatedNoSidebarImport
    }
    '/_authenticated-no-sidebar/assign-coordinator': {
      id: '/_authenticated-no-sidebar/assign-coordinator'
      path: '/assign-coordinator'
      fullPath: '/assign-coordinator'
      preLoaderRoute: typeof AuthenticatedNoSidebarAssignCoordinatorImport
      parentRoute: typeof AuthenticatedNoSidebarImport
    }
    '/_authenticated/classes': {
      id: '/_authenticated/classes'
      path: '/classes'
      fullPath: '/classes'
      preLoaderRoute: typeof AuthenticatedClassesImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/company': {
      id: '/_authenticated/company'
      path: '/company'
      fullPath: '/company'
      preLoaderRoute: typeof AuthenticatedCompanyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/dashboard': {
      id: '/_authenticated/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof AuthenticatedDashboardImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/departments': {
      id: '/_authenticated/departments'
      path: '/departments'
      fullPath: '/departments'
      preLoaderRoute: typeof AuthenticatedDepartmentsImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/ojt': {
      id: '/_authenticated/ojt'
      path: '/ojt'
      fullPath: '/ojt'
      preLoaderRoute: typeof AuthenticatedOjtImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/profile': {
      id: '/_authenticated/profile'
      path: '/profile'
      fullPath: '/profile'
      preLoaderRoute: typeof AuthenticatedProfileImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/programs': {
      id: '/_authenticated/programs'
      path: '/programs'
      fullPath: '/programs'
      preLoaderRoute: typeof AuthenticatedProgramsImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/requests': {
      id: '/_authenticated/requests'
      path: '/requests'
      fullPath: '/requests'
      preLoaderRoute: typeof AuthenticatedRequestsImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/templates': {
      id: '/_authenticated/templates'
      path: '/templates'
      fullPath: '/templates'
      preLoaderRoute: typeof AuthenticatedTemplatesImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/users': {
      id: '/_authenticated/users'
      path: '/users'
      fullPath: '/users'
      preLoaderRoute: typeof AuthenticatedUsersImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/reports/$day': {
      id: '/_authenticated/reports/$day'
      path: '/reports/$day'
      fullPath: '/reports/$day'
      preLoaderRoute: typeof AuthenticatedReportsDayImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/reports/': {
      id: '/_authenticated/reports/'
      path: '/reports'
      fullPath: '/reports'
      preLoaderRoute: typeof AuthenticatedReportsIndexImport
      parentRoute: typeof AuthenticatedImport
    }
  }
}

// Create and export the route tree

interface AuthenticatedRouteChildren {
  AuthenticatedClassesRoute: typeof AuthenticatedClassesRoute
  AuthenticatedCompanyRoute: typeof AuthenticatedCompanyRoute
  AuthenticatedDashboardRoute: typeof AuthenticatedDashboardRoute
  AuthenticatedDepartmentsRoute: typeof AuthenticatedDepartmentsRoute
  AuthenticatedOjtRoute: typeof AuthenticatedOjtRoute
  AuthenticatedProfileRoute: typeof AuthenticatedProfileRoute
  AuthenticatedProgramsRoute: typeof AuthenticatedProgramsRoute
  AuthenticatedRequestsRoute: typeof AuthenticatedRequestsRoute
  AuthenticatedTemplatesRoute: typeof AuthenticatedTemplatesRoute
  AuthenticatedUsersRoute: typeof AuthenticatedUsersRoute
  AuthenticatedReportsDayRoute: typeof AuthenticatedReportsDayRoute
  AuthenticatedReportsIndexRoute: typeof AuthenticatedReportsIndexRoute
}

const AuthenticatedRouteChildren: AuthenticatedRouteChildren = {
  AuthenticatedClassesRoute: AuthenticatedClassesRoute,
  AuthenticatedCompanyRoute: AuthenticatedCompanyRoute,
  AuthenticatedDashboardRoute: AuthenticatedDashboardRoute,
  AuthenticatedDepartmentsRoute: AuthenticatedDepartmentsRoute,
  AuthenticatedOjtRoute: AuthenticatedOjtRoute,
  AuthenticatedProfileRoute: AuthenticatedProfileRoute,
  AuthenticatedProgramsRoute: AuthenticatedProgramsRoute,
  AuthenticatedRequestsRoute: AuthenticatedRequestsRoute,
  AuthenticatedTemplatesRoute: AuthenticatedTemplatesRoute,
  AuthenticatedUsersRoute: AuthenticatedUsersRoute,
  AuthenticatedReportsDayRoute: AuthenticatedReportsDayRoute,
  AuthenticatedReportsIndexRoute: AuthenticatedReportsIndexRoute,
}

const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren,
)

interface AuthenticatedNoSidebarRouteChildren {
  AuthenticatedNoSidebarAssignCompanyRoute: typeof AuthenticatedNoSidebarAssignCompanyRoute
  AuthenticatedNoSidebarAssignCoordinatorRoute: typeof AuthenticatedNoSidebarAssignCoordinatorRoute
}

const AuthenticatedNoSidebarRouteChildren: AuthenticatedNoSidebarRouteChildren =
  {
    AuthenticatedNoSidebarAssignCompanyRoute:
      AuthenticatedNoSidebarAssignCompanyRoute,
    AuthenticatedNoSidebarAssignCoordinatorRoute:
      AuthenticatedNoSidebarAssignCoordinatorRoute,
  }

const AuthenticatedNoSidebarRouteWithChildren =
  AuthenticatedNoSidebarRoute._addFileChildren(
    AuthenticatedNoSidebarRouteChildren,
  )

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '': typeof AuthenticatedNoSidebarRouteWithChildren
  '/register': typeof RegisterRoute
  '/assign-company': typeof AuthenticatedNoSidebarAssignCompanyRoute
  '/assign-coordinator': typeof AuthenticatedNoSidebarAssignCoordinatorRoute
  '/classes': typeof AuthenticatedClassesRoute
  '/company': typeof AuthenticatedCompanyRoute
  '/dashboard': typeof AuthenticatedDashboardRoute
  '/departments': typeof AuthenticatedDepartmentsRoute
  '/ojt': typeof AuthenticatedOjtRoute
  '/profile': typeof AuthenticatedProfileRoute
  '/programs': typeof AuthenticatedProgramsRoute
  '/requests': typeof AuthenticatedRequestsRoute
  '/templates': typeof AuthenticatedTemplatesRoute
  '/users': typeof AuthenticatedUsersRoute
  '/reports/$day': typeof AuthenticatedReportsDayRoute
  '/reports': typeof AuthenticatedReportsIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '': typeof AuthenticatedNoSidebarRouteWithChildren
  '/register': typeof RegisterRoute
  '/assign-company': typeof AuthenticatedNoSidebarAssignCompanyRoute
  '/assign-coordinator': typeof AuthenticatedNoSidebarAssignCoordinatorRoute
  '/classes': typeof AuthenticatedClassesRoute
  '/company': typeof AuthenticatedCompanyRoute
  '/dashboard': typeof AuthenticatedDashboardRoute
  '/departments': typeof AuthenticatedDepartmentsRoute
  '/ojt': typeof AuthenticatedOjtRoute
  '/profile': typeof AuthenticatedProfileRoute
  '/programs': typeof AuthenticatedProgramsRoute
  '/requests': typeof AuthenticatedRequestsRoute
  '/templates': typeof AuthenticatedTemplatesRoute
  '/users': typeof AuthenticatedUsersRoute
  '/reports/$day': typeof AuthenticatedReportsDayRoute
  '/reports': typeof AuthenticatedReportsIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/_authenticated': typeof AuthenticatedRouteWithChildren
  '/_authenticated-no-sidebar': typeof AuthenticatedNoSidebarRouteWithChildren
  '/register': typeof RegisterRoute
  '/_authenticated-no-sidebar/assign-company': typeof AuthenticatedNoSidebarAssignCompanyRoute
  '/_authenticated-no-sidebar/assign-coordinator': typeof AuthenticatedNoSidebarAssignCoordinatorRoute
  '/_authenticated/classes': typeof AuthenticatedClassesRoute
  '/_authenticated/company': typeof AuthenticatedCompanyRoute
  '/_authenticated/dashboard': typeof AuthenticatedDashboardRoute
  '/_authenticated/departments': typeof AuthenticatedDepartmentsRoute
  '/_authenticated/ojt': typeof AuthenticatedOjtRoute
  '/_authenticated/profile': typeof AuthenticatedProfileRoute
  '/_authenticated/programs': typeof AuthenticatedProgramsRoute
  '/_authenticated/requests': typeof AuthenticatedRequestsRoute
  '/_authenticated/templates': typeof AuthenticatedTemplatesRoute
  '/_authenticated/users': typeof AuthenticatedUsersRoute
  '/_authenticated/reports/$day': typeof AuthenticatedReportsDayRoute
  '/_authenticated/reports/': typeof AuthenticatedReportsIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | ''
    | '/register'
    | '/assign-company'
    | '/assign-coordinator'
    | '/classes'
    | '/company'
    | '/dashboard'
    | '/departments'
    | '/ojt'
    | '/profile'
    | '/programs'
    | '/requests'
    | '/templates'
    | '/users'
    | '/reports/$day'
    | '/reports'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | ''
    | '/register'
    | '/assign-company'
    | '/assign-coordinator'
    | '/classes'
    | '/company'
    | '/dashboard'
    | '/departments'
    | '/ojt'
    | '/profile'
    | '/programs'
    | '/requests'
    | '/templates'
    | '/users'
    | '/reports/$day'
    | '/reports'
  id:
    | '__root__'
    | '/'
    | '/_authenticated'
    | '/_authenticated-no-sidebar'
    | '/register'
    | '/_authenticated-no-sidebar/assign-company'
    | '/_authenticated-no-sidebar/assign-coordinator'
    | '/_authenticated/classes'
    | '/_authenticated/company'
    | '/_authenticated/dashboard'
    | '/_authenticated/departments'
    | '/_authenticated/ojt'
    | '/_authenticated/profile'
    | '/_authenticated/programs'
    | '/_authenticated/requests'
    | '/_authenticated/templates'
    | '/_authenticated/users'
    | '/_authenticated/reports/$day'
    | '/_authenticated/reports/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthenticatedRoute: typeof AuthenticatedRouteWithChildren
  AuthenticatedNoSidebarRoute: typeof AuthenticatedNoSidebarRouteWithChildren
  RegisterRoute: typeof RegisterRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  AuthenticatedNoSidebarRoute: AuthenticatedNoSidebarRouteWithChildren,
  RegisterRoute: RegisterRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/_authenticated",
        "/_authenticated-no-sidebar",
        "/register"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/_authenticated": {
      "filePath": "_authenticated.tsx",
      "children": [
        "/_authenticated/classes",
        "/_authenticated/company",
        "/_authenticated/dashboard",
        "/_authenticated/departments",
        "/_authenticated/ojt",
        "/_authenticated/profile",
        "/_authenticated/programs",
        "/_authenticated/requests",
        "/_authenticated/templates",
        "/_authenticated/users",
        "/_authenticated/reports/$day",
        "/_authenticated/reports/"
      ]
    },
    "/_authenticated-no-sidebar": {
      "filePath": "_authenticated-no-sidebar.tsx",
      "children": [
        "/_authenticated-no-sidebar/assign-company",
        "/_authenticated-no-sidebar/assign-coordinator"
      ]
    },
    "/register": {
      "filePath": "register.tsx"
    },
    "/_authenticated-no-sidebar/assign-company": {
      "filePath": "_authenticated-no-sidebar/assign-company.tsx",
      "parent": "/_authenticated-no-sidebar"
    },
    "/_authenticated-no-sidebar/assign-coordinator": {
      "filePath": "_authenticated-no-sidebar/assign-coordinator.tsx",
      "parent": "/_authenticated-no-sidebar"
    },
    "/_authenticated/classes": {
      "filePath": "_authenticated/classes.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/company": {
      "filePath": "_authenticated/company.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/dashboard": {
      "filePath": "_authenticated/dashboard.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/departments": {
      "filePath": "_authenticated/departments.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/ojt": {
      "filePath": "_authenticated/ojt.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/profile": {
      "filePath": "_authenticated/profile.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/programs": {
      "filePath": "_authenticated/programs.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/requests": {
      "filePath": "_authenticated/requests.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/templates": {
      "filePath": "_authenticated/templates.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/users": {
      "filePath": "_authenticated/users.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/reports/$day": {
      "filePath": "_authenticated/reports.$day.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/reports/": {
      "filePath": "_authenticated/reports.index.tsx",
      "parent": "/_authenticated"
    }
  }
}
ROUTE_MANIFEST_END */
