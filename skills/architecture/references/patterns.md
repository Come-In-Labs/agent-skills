# Concrete module patterns

## Contents

1. Minimal module contract
2. Manifest-like domain entry
3. Explicit registry and composers
4. Schema-first GraphQL
5. Large GraphQL modules
6. Persistence vocabulary
7. Canonical vocabulary ownership
8. Request context
9. Common package boundaries
10. Transaction-isolated tests
11. Multi-runtime domains
12. Anti-pattern comparisons

## 1. Minimal module contract

Start with capabilities the application already needs:

```ts
export type Module = {
  graphql?: GraphqlModule;
  routes?: RouteModule;
  jobs?: JobModule;
};
```

Do not add `load`, `setup`, `initialize`, `ready`, `start`, `afterStart`, `stop`, and
`dispose` preemptively. Add a lifecycle hook when a real module cannot express its setup as
declarative configuration.

Prefer data over callbacks when registration is declarative:

```ts
type JobModule = readonly {
  name: string;
  schedule?: string;
  handler: JobHandler;
}[];
```

Use a lifecycle method for real ordered or conditional work:

```ts
type Module = {
  start?(app: Application): Promise<void> | void;
};
```

## 2. Manifest-like domain entry

Assemble domain participation without exporting internals:

```ts
import graphql from './graphql';
import jobs from './jobs';
import routes from './routes';

import type { Module } from '../../module';

const Projects = {
  graphql,
  jobs,
  routes,
} satisfies Module;

export default Projects;
```

Do not turn the entry into this:

```ts
export * from './models/Project';
export * from './services/createProject';
export * from './services/updateProject';
export * from './policies/visibility';
export * from './graphql/queries';
```

Export a symbol intentionally when another domain has a legitimate dependency on it. Prefer
an explicit named export over a catch-all barrel.

## 3. Explicit registry and composers

Keep installed modules visible:

```ts
import Auth from './domains/auth';
import Projects from './domains/projects';
import Teams from './domains/teams';

import type { Module } from './module';

export const modules = [Auth, Projects, Teams] satisfies readonly Module[];
```

Make root composition generic:

```ts
export function composeGraphql(
  schema: GraphQLSchema,
  modules: readonly Module[],
): GraphQLSchema {
  return modules.reduce((current, module) => {
    if (!module.graphql) return current;
    return addGraphqlModule(current, module.graphql);
  }, schema);
}
```

Apply the same approach to routes and jobs only when those capabilities exist. Do not create
empty composers as architectural decoration.

## 4. Schema-first GraphQL

Make the API readable before the resolver implementation:

```ts
const typeDefs = /* GraphQL */ `
  type Project {
    id: ID!
    title: String!
    viewerCanManage: Boolean!
  }

  extend type Query {
    project(id: ID!): Project
  }

  extend type Mutation {
    archiveProject(id: ID!): Project!
  }
`;

export default graphql(({ guard }) => ({
  typeDefs,
  resolvers: {
    Query: {
      project: (_root, { id }, context) => loadVisibleProject(id, context.user),
    },
    Mutation: {
      archiveProject: guard({ permissions: 'projects.manage' })(
        (_root, { id }, context) => archiveProject(id, context),
      ),
    },
    Project: {
      viewerCanManage: (project, _args, context) =>
        canManageProject(context.user, project),
    },
  },
}));
```

Use generated server resolver types when available. Keep resolver categories predictable:

```text
Query
Mutation
Subscription
<ObjectType>
```

Keep authorization visible at the field boundary. Keep expensive nested reads in field
resolvers and request-scoped loaders so they run only when selected.

When a builder or router supports declarative authorization, use it for fixed requirements
instead of repeating the guard inside the resolver. See the authorization decision table
below for the protocol-specific forms.

The resolver enhancer above is the SDL boundary equivalent of a declarative scope. It
validates the already-built context and gives the wrapped resolver a non-null user type. It
must not load the user or permissions itself.

## 5. Large GraphQL modules

Split a large domain by capability while preserving one public GraphQL capability:

```text
domains/projects/graphql/
  index.ts
  core.ts
  membership.ts
  milestones.ts
  sharing.ts
  templates.ts
  admin.ts
```

```ts
import admin from './admin';
import core from './core';
import membership from './membership';
import milestones from './milestones';

export default [core, membership, milestones, admin] satisfies GraphqlModule[];
```

Let the generic composer accept one module or a list, or compose the facets inside the
domain. Keep the choice consistent across the repository.

Split by API vocabulary or capability, not mechanically at an arbitrary line count.

## 6. Persistence vocabulary

Give repeated domain policies stable names:

```ts
export function visibleProjectCondition(viewer: Viewer) {
  return or(
    eq(projects.visibility, 'public'),
    viewer.id ? eq(projects.ownerId, viewer.id) : undefined,
    viewer.teamIds.length ? inArray(projects.teamId, viewer.teamIds) : undefined,
  );
}

export function activeProjectCondition(now: Date) {
  return and(eq(projects.status, 'active'), gte(projects.dueAt, now));
}
```

Compose policy at the query site:

```ts
const rows = await db.query.projects.findMany({
  where: and(
    visibleProjectCondition(viewer),
    activeProjectCondition(now),
  ),
});
```

Extract orchestration when it owns invariants and side effects:

```ts
export async function archiveProject(command: ArchiveProjectCommand, context: Context) {
  return context.db.transaction(async (tx) => {
    const project = await requireManageableProject(tx, command.projectId, context.viewer);
    await markArchived(tx, project, command.reason);
    await writeOutboxEvent(tx, projectArchived(project));
    return project;
  });
}
```

Do not create `ProjectRepository.findById()` when the implementation is one direct lookup and no
policy is attached.

## 7. Canonical vocabulary ownership

Choose ownership from meaning, not from the layer that first needed the concept.

```ts
// packages/common/src/projects/contracts.ts
export const PROJECT_STATUSES = ['draft', 'active', 'archived', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
```

Every runtime consumes that contract directly:

```ts
// server/domains/projects/schema.ts
import type { ProjectStatus } from '@company/common/projects';

// app/domains/projects/ProjectStatusBadge.tsx
import type { ProjectStatus } from '@company/common/projects';

// worker/domains/projects/jobs.ts
import type { ProjectStatus } from '@company/common/projects';
```

Do not introduce `ProjectStatusName`, `ApiProjectStatus`, or `WorkerProjectState` when they represent the
same values and semantics. The database table owns storage and constraints, the GraphQL SDL
owns wire shape, and the worker owns side effects, but none of those layers redefine the
domain concept.

Apply the same rule to:

- enum-like values and discriminated unions
- validation and normalization rules
- event names and payloads
- role and capability vocabulary
- pure state transitions and calculations
- identifiers whose format is a domain contract

Keep the concept in one runtime domain when only that runtime consumes it. Move it to common
only after a second runtime needs the same meaning. Keep I/O, ORM rows, caches, framework
contexts, and handlers out of the shared contract.

### Authorization example

Authorization follows the same ownership rule:

- `common/auth` owns pure `Capability`, `AdminRole`, their values, and pure role mappings
  when client and server both consume them.
- Server auth owns grant queries, caching, superuser bridging, `hasPermissions()`, and
  `guard()`.
- Database schema consumes `AdminRole`; it does not define `AdminRoleName` or own the role
  list.
- Client admin UI consumes `AdminRole`; it does not maintain an `AssignableRole` mirror.

Choose the narrowest boundary API for each authorization shape:

| Requirement | Mechanism |
|---|---|
| Fixed permission on a Pothos field | `t.withAuth({ capability })` |
| Authenticated SDL resolver | `guard(resolver)` |
| Fixed permission in SDL without an auth directive | `guard(criteria)(resolver)` |
| Permissions computed from arguments | A guarded resolver plus `guard(user, dynamicCriteria)` at the decision point |
| Permission changes projection or visibility | `hasPermissions(user, criteria)` |
| Ownership, membership, or resource visibility | Owning-domain policy such as `canManageProject()` |

Do not let ordinary consumers call `loadCapabilities()` and inspect the returned set. That
leaks caching, superuser bridging, and permission semantics out of auth. Expose the complete
list only when the API intentionally serializes it or inside auth tests.

Return `UNAUTHENTICATED` for missing identity and `FORBIDDEN` for insufficient authority.
Use `NOT_FOUND` only when hiding resource existence is an intentional compatibility or
security contract.

## 8. Request context

Create protocol context once, including a complete request principal:

```ts
export type RequestUser = {
  id: string;
  roles: readonly Role[];
  capabilities: readonly Capability[];
};

export type RequestContext = {
  db: Database;
  user: RequestUser | null;
  loaders: Loaders;
  requestId: string;
  locale: Locale;
};
```

Authentication middleware or GraphQL context construction resolves the session, loads the
request user and request-wide authorization facts, applies superuser bridging, rejects or
nulls disabled identities, and then dispatches. Whether that principal comes from one SQL
query, a request cache, Redis, or a token is an infrastructure choice with its own freshness
and invalidation tradeoff.

Use boundary enhancers to validate and narrow that context:

```ts
type AuthenticatedContext = RequestContext & { user: RequestUser };

const myProjects = guard((_root, _args, { user }: AuthenticatedContext) =>
  loadProjectsForUser(user.id)
);
```

The enhancer checks the prepared principal. It does not fetch it. This keeps every guarded
domain resolver on the same direct happy path and makes the guarantee visible in both the
call-site syntax and TypeScript type.

Let domain operations accept the context or the exact dependencies they need. Avoid passing
`viewer`, `db`, `loaders`, and `requestId` through several forwarding layers.

Do not turn context into an untyped service locator. Keep its fields small, stable, and
request-scoped.

Do not eagerly hydrate rare domain entities into context. Request identity, tenant, locale,
transaction, and other broadly reused facts belong there; a particular project or team belongs
in its domain operation or loader.

## 9. Common package boundaries

Use a common package for contracts consumed by multiple runtimes:

```text
packages/common/src/projects/
  contracts.ts
  events.ts
  validation.ts
```

Allow:

- enums and discriminated unions
- validation schemas
- event payloads
- pure calculations and state transitions
- compatibility helpers without runtime I/O

Organize the package by the domain that owns the meaning. `common` is a distribution
boundary, not the owner of a new global grab-bag domain.

Reject:

- React components and hooks
- ORM row types and database clients
- Express or GraphQL resolver context
- Redis or queue clients
- server environment access
- worker handlers
- browser globals

Expose one intentional subpath per shared domain:

```json
{
  "exports": {
    "./auth": "./src/auth/index.ts",
    "./projects": "./src/projects/index.ts"
  }
}
```

Avoid a root source barrel that must be updated for every internal addition. The domain
entry exposes its intentional public contract; internal file additions do not require a
package-wide export edit.

## 10. Transaction-isolated tests

Make ordinary tests transparently transactional:

```ts
beforeAll(async () => {
  await Setup.beginSuiteTransaction();
});

beforeEach(async () => {
  await Setup.beginTestSavepoint();
});

afterEach(async () => {
  await Setup.rollbackTestSavepoint();
});

afterAll(async () => {
  await Setup.rollbackSuiteTransaction();
});
```

Route the stable public database entry through asynchronous request or test context. Tests
should use the normal `db` without wrapping their bodies manually.

Provide explicit committed mode:

```ts
Setup.disableIsolation();
```

Use committed mode only for behavior that needs independent connections, real commits,
advisory locks, worker processes, or transaction visibility. Keep cleanup automatic or
schema-derived for that exceptional mode.

Use a nested transaction or savepoint for expected constraint failures so PostgreSQL does
not leave the surrounding test transaction aborted.

## 11. Multi-runtime domains

Keep one conceptual domain with separate runtime entries:

```text
packages/common/src/projects/
apps/web/src/domains/projects/
apps/api/src/domains/projects/
apps/worker/src/domains/projects/
```

Do not create one physical module that mixes browser, API, and worker dependencies. Share
only pure contracts and calculations.

Each runtime owns its composition root and imports the domain entry appropriate to that
runtime.

## 12. Anti-pattern comparisons

### Manual root knowledge

Avoid:

```ts
registerProjectTypes(builder);
registerProjectQueries(builder);
mountProjectRoutes(app);
registerProjectJobs(worker);
```

across several root files.

Prefer:

```ts
const Projects = { graphql, routes, jobs } satisfies Module;
```

registered once.

### Specialized permission wrappers

Avoid ten helpers that only change a permission constant. Prefer one generic guard with a
typed permission value. Preserve specialized helpers only when they encode entity policy or
compatibility behavior.

### Maintenance-heavy public barrels

Avoid exporting every source file through nested `index.ts` barrels. Use the domain entry as
a manifest and expose only intentional cross-domain contracts.

### Layer multiplication

Avoid a series of files where each function forwards the same arguments. Collapse until
each remaining layer owns policy, orchestration, protocol, persistence, or integration.
