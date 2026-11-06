---
name: architecture
description: Design, audit, or refactor software into predictable, low-entropy domain modules with one manifest-like entry per domain, explicit application composition, readable API definitions, one canonical owner and name for every shared concept, pure cross-runtime contracts, complete request context, boundary wrappers that validate and narrow, meaningful persistence vocabulary, declarative boundary policy, and correctness-first defaults. Use when asked to simplify architecture, establish domain boundaries, modularize a backend or monorepo, split a large feature, create a common package, consolidate duplicated types, constants, enums, permissions, roles, or mappings across app, server, worker, and schema layers, reduce registration or dependency plumbing, make a codebase easier to navigate, compare architecture quality, or review whether a proposed abstraction improves human comprehension.
---

# CIL Architecture

## Core principle

Spend complexity once in stable foundations so ordinary domain code remains direct,
predictable, and boring.

Optimize for recognition over recall. After learning one domain, a developer should be
able to predict where the API, persistence, authorization, jobs, routes, tests, and
registration of another domain live.

Do not chase the smallest total line count. Reduce the number of architectural shapes,
places to search, decisions to repeat, and exceptions to remember.

Give every shared concept one canonical owner, one name, and one public path. Other runtimes
and domains consume that definition; they do not mirror or rename it.

Attach cross-cutting behavior to the declaration that already owns the fact it observes.
Never rebuild routes, events, commands, fields, or jobs in a second hand-maintained registry
just so telemetry, authorization, deprecation, or another platform concern can recognize them.

Build stable request-wide facts once at the protocol boundary. Let small boundary wrappers
validate preconditions and narrow types before domain code runs. A domain body should consume
the prepared context and express the happy path, not rebuild identity, permissions, locale,
tenant, transaction, or other request prerequisites field by field.

## Select the operating mode

- **Design:** Define a coherent architecture for a new system or major capability.
- **Audit:** Explain why an existing codebase is difficult to follow and identify its
  sources of cognitive entropy.
- **Refactor:** Move an existing system toward a stable domain grammar without changing
  behavior or public contracts.
- **Review:** Judge a proposed structure, abstraction, package, or module contract before
  implementation.

State the selected mode and scope. For implementation work, preserve the user's requested
pace and stopping points.

## Load the relevant references

- Read [principles.md](references/principles.md) for architecture analysis, tradeoff
  explanations, and the human factors behind the method.
- Read [patterns.md](references/patterns.md) when designing or implementing module entries,
  GraphQL composition, persistence scopes, authorization, context, common packages, or
  test isolation.
- Read [migration-playbook.md](references/migration-playbook.md) before restructuring an
  existing codebase, moving runtime roots, or changing domain boundaries.

Do not load every reference automatically when one is sufficient.

## Workflow

### 1. Read executable truth first

Read the nearest `AGENTS.md`, `CLAUDE.md`, package manifests, path aliases, build scripts,
test configuration, and composition roots before proposing a structure.

Identify:

- runtimes and deployment units
- current domain or feature directories
- application entry points and registration files
- public API surfaces and shipped consumers
- database and transaction boundaries
- background jobs, queues, and event payloads
- shared packages and their dependency direction
- existing architecture exemplars that are easier to follow than their neighbors

Prefer current code, tests, and build configuration over stale architecture documents.

### 2. Map the current grammar

For representative domains, record:

| Question | Current answer |
|---|---|
| Where does the domain live? | path or several paths |
| What is its public entry? | file, registry, or none |
| Where is its API visible? | SDL, builders, routes, or scattered calls |
| Where is business persistence logic? | models, services, handlers, or inline queries |
| How is authorization expressed? | permission, role, specialized guard, or inline check |
| How are jobs and events registered? | domain entry, worker root, or several registries |
| How are tests isolated? | rollback, cleanup, reset, or shared state |
| How many roots must change to add one capability? | concrete count and files |

Compare at least one small domain and one large domain. Do not infer the architecture from
the tidiest example alone.

### 3. Diagnose cognitive entropy

Report concrete sources of friction, not aesthetic preferences. Look for:

- one concept with several homes
- one extension requiring edits in several unrelated roots
- a cross-cutting concern maintaining its own domain-specific copy of routes, events, jobs,
  permissions, or other declarations it could instrument at their source
- inconsistent folder and resolver shapes between sibling domains
- public entry points that are catch-all barrels instead of module manifests
- infrastructure names leaking into business code
- domain vocabulary mirrored or renamed across app, server, worker, API, and schema
- a consuming layer owning a shared concept merely because it was the first consumer
- database or transport schemas accidentally becoming the source of domain vocabulary
- consumers reaching through the owning domain to inspect storage or runtime representation
- specialized authorization helpers encoding the same permission check
- static field authorization implemented through manual resolver checks when the API
  framework already supports declarative scopes
- consumers loading raw permission sets and calling `.has()` instead of using the
  authorization boundary
- resolvers repeating setup preambles such as `const user = await guard(context)` before
  reaching domain behavior
- guards or helpers that secretly hydrate request identity, permissions, tenant, locale, or
  transaction state after domain execution has already begun
- wrappers that validate a nullable context but fail to expose the validated, narrowed type
  to the wrapped code
- stable request facts reloaded independently by sibling resolvers
- repeated query policy expressed as slightly different SQL
- dependencies passed through layers that could read one request context
- ordinary tests managing cleanup manually
- shared packages importing runtime-specific code
- large domains split by technical layer without a stable conceptual module
- architecture that can only be reconstructed through documentation archaeology

Distinguish essential complexity from accidental complexity. Multiple runtimes, durable
queues, native-client compatibility, geospatial SQL, concurrency, and external contracts
may be load-bearing. Organize them clearly instead of pretending they do not exist.

### 4. Define the target grammar

Write the smallest repeated grammar that answers the navigation questions consistently.
Start from the best existing exemplar when one exists.

Prefer this conceptual shape:

```text
<runtime>/domains/<domain>/
  index.ts              # manifest and intentional public API
  graphql/              # SDL and resolver maps, split by capability when needed
  models/               # domain entities and meaningful persistence vocabulary
  services/             # orchestration with real branching or side effects
  policies/             # authorization and domain rules
  routes/               # compatibility or protocol-specific routes
  jobs/                  # domain-owned background registrations and handlers
  __tests__/
```

Adapt names to the repository's established language. Do not reorganize files merely to
match this exact spelling.

Define a minimal module contract from capabilities already needed. A public domain entry
should answer what the domain contributes to the runtime. It should not re-export every
internal file.

### 5. Keep composition explicit

Register each domain once in an obvious composition root. Let generic composers gather its
GraphQL, routes, jobs, loaders, or lifecycle hooks.

Prefer an explicit typed list over filesystem discovery or decorator magic. Ordering and
dependencies should be visible when they matter.

Do not add speculative lifecycle machinery. Add a capability to the module contract only
when at least one real domain needs it.

### 6. Abstract repeated mechanics, preserve domain meaning

Centralize stable mechanics such as:

- schema composition
- request transaction selection
- data-loader construction
- permission evaluation and guards
- validation execution
- timestamps and serialization
- test setup and rollback

Attach those mechanics at the owning declaration. For example, mark a legacy route with a
generic `legacyRoute('follows.counts')` middleware beside its one Express path declaration.
Do not create a `LEGACY_FOLLOWS_ROUTES` matcher table in telemetry code: that duplicates the
router, is limited to one domain, and will drift. The mechanism is generic; the stable name
and lifecycle remain visible in the owning domain.

For repeated boundary preconditions, use the three-part pattern across every domain:

1. **Hydrate once:** Build a complete, typed request context before dispatching domain code.
2. **Validate once:** Apply a small protocol wrapper or declarative scope at the field,
   route, job, or command boundary.
3. **Narrow inside:** Let the wrapped implementation receive the stronger context type and
   read its prepared values directly.

The wrapper must not be a hidden data loader. If it repeatedly fetches stable request-wide
state, move that hydration to context construction. Do not eagerly put rare entity data or
every possible service into context; completeness means complete for shared request facts,
not a global service locator.

For every shared concept, separate vocabulary from runtime mechanics:

- Put the canonical type, values, pure mappings, validation, and event contract in the
  owning domain's pure shared entry when multiple runtimes consume them.
- Keep database access, caches, side effects, framework integration, and runtime policy in
  the owning domain of the relevant runtime.
- Make schemas, transports, UI, and workers consume the canonical vocabulary. Do not let
  each layer create a local alias or mirror.
- Expose a narrow domain operation or policy instead of making consumers inspect storage,
  caches, raw sets, or database rows.

Authorization is one application of this rule: common owns pure capability and role
vocabulary, server auth owns grant evaluation, protocol scopes own static rejection, and
entity domains own membership or visibility rules.

Keep domain behavior readable at the call site. Extract a named policy when the name conveys
meaning such as `visibleTo(viewer)` or `openForRegistration(now)`. Do not wrap a one-line ORM
expression merely to hide the ORM.

Prefer direct domain flow over mandatory controller, use-case, service, repository, and
adapter layers for every operation. Introduce a layer only when it owns a real boundary,
policy, or orchestration concern.

### 7. Make correctness the default path

Design defaults so ordinary feature code does the safe thing without ceremony:

- automatic transaction rollback in integration tests
- complete request principals and stable request facts before domain dispatch
- boundary wrappers that validate and type-narrow without reloading context
- declarative permission scopes for static API fields
- generic guards for SDL boundaries and genuinely dynamic requirements
- boolean permission checks for soft visibility decisions
- request-scoped loaders for list fields
- typed module registration
- schema and resolver validation during composition
- pure shared packages with enforced dependency direction

Make exceptions explicit and rare, such as `disableIsolation()` for tests that genuinely
require independent committed connections.

### 8. Pilot before generalizing

Choose one small, coherent, representative domain. Convert it end to end:

1. Give it one manifest-like entry.
2. Move its registration behind generic composition.
3. Make its API readable in one predictable location.
4. Use shared authorization and request context.
5. Preserve public behavior and compatibility.
6. Validate types, tests, and runtime startup.

Use the pilot to refine the grammar. Do not begin with the largest or most coupled domain.

### 9. Scale large domains internally

Keep a large capability as one conceptual module when it shares lifecycle, persistence,
API ownership, and operational responsibility. Split its internals by recognizable facets:

```text
graphql/queries.ts
graphql/mutations.ts
graphql/membership.ts
graphql/milestones.ts
graphql/admin.ts
```

Create a separate domain only when the capability has a sufficiently independent lifecycle,
persistence model, public API, or operational owner. Do not create artificial micro-domains
to make directories look small.

### 10. Verify the result as a human system

After implementation or proposal, answer these questions:

- Can a newcomer identify the domain's home without repository-wide search?
- Does `index.ts` reveal what the domain contributes without exposing internals?
- Can the public API be understood before reading implementation details?
- Does adding a domain require one registration change rather than several manual edits?
- Are authorization and persistence policies named in domain language?
- Is each shared concept defined once under its real owner, with runtime mechanics kept out
  of the pure contract?
- Do UI, API, database schema, and worker code consume the same name rather than define
  layer-specific aliases?
- Can a reviewer distinguish static rejection, dynamic rejection, soft visibility, and
  entity policy from the call site?
- Do guarded implementations receive the prepared, non-null principal directly, without an
  inline setup preamble or hidden reload?
- Are public operations visibly public instead of wrapped in no-op ceremony?
- Are cross-runtime contracts pure and intentionally shared?
- Do normal integration tests clean themselves up?
- Can a developer predict the structure of the next domain?
- Did the change reduce architectural shapes and exceptions?

If several answers are no, the architecture is not yet simpler even if the files moved.

## Decision rules

### Give every shared concept one canonical owner

- **One runtime and one domain:** Keep vocabulary and implementation in that domain. Do not
  move code to common merely for neatness.
- **Several runtimes:** Put the pure type, values, mappings, validation, calculations, or
  event payload in the common entry for the owning domain.
- **Runtime implementation:** Keep persistence, I/O, caches, side effects, and framework
  adapters in the owning domain of that runtime.
- **Database and transport schemas:** Consume canonical domain vocabulary. Do not redefine
  it with layer suffixes such as `Name`, `RowType`, `ApiType`, or `Assignable` unless the
  meaning is genuinely different.
- **Consumers:** Depend on the public contract or narrow domain operation, not an internal
  representation.

Use one name when the meaning is the same. Introduce a second type only when it represents a
real semantic boundary, and make the conversion explicit at that boundary.

### Apply canonical ownership to authorization

- **Shared vocabulary:** Pure capability and role types, constants, and mappings used by
  more than one runtime belong in a common auth contract.
- **Runtime enforcement:** Grant queries, caches, superuser behavior, and permission
  evaluation belong in the runtime's auth domain.
- **Static API requirement:** Use the framework's declarative field or route authorization.
- **Dynamic API requirement:** Use one generic guard with the computed requirement.
- **Soft visibility decision:** Use a boolean permission predicate.
- **Entity rule:** Keep ownership, membership, and visibility policy in the entity's domain.

For example, do not create aliases such as `AssignableRole` and `AdminRoleName` for the same
role in different layers. Do not export raw permission loaders for ordinary consumers.
Reserve a full permission list for serialization boundaries or auth internals.

Use `UNAUTHENTICATED` for a missing or invalid identity and `FORBIDDEN` for an authenticated
identity lacking authority. Use `NOT_FOUND` only for an intentional resource-concealment
contract, not as the default permission error.

### Hydrate once, validate at the boundary, narrow inside

- Put stable request-wide facts in the typed protocol context: the authenticated principal,
  its request-relevant roles and capabilities, tenant, locale, transaction, request id, and
  similarly universal values actually used by the application.
- Construct that context before dispatch. Use a request cache or external cache only when it
  has a clear invalidation policy; caching is an implementation choice, not permission for
  resolvers to reload the same principal.
- Express repeated preconditions through the protocol's declarative scope or one small
  resolver, route, job, or command enhancer.
- Make the enhancer expose a stronger input type. After an authentication wrapper succeeds,
  wrapped code should see a non-null user and use `context.user` directly.
- Keep entity-specific loading and policy in the owning domain. A complete request context
  does not contain every project, team, or record the request might touch.
- Leave intentionally public operations unwrapped. The absence of a boundary wrapper is a
  useful signal when public access is deliberate.

Avoid this repeated shape:

```ts
resolve: async (_root, args, context) => {
  const user = await guard(context);
  return performDomainWork(user.id, args);
}
```

Prefer a boundary guarantee and a direct domain body:

```ts
resolve: guard(async (_root, args, { user }) =>
  performDomainWork(user.id, args)
)
```

This is not specific to authorization. Apply the same reasoning whenever domain bodies
reconstruct stable protocol context or repeat a cross-cutting precondition.

### Put code in a common package only when

- at least two runtimes consume it now
- it is pure domain contract, validation, calculation, or event data
- it imports no UI framework, ORM, database, server, worker, or platform runtime
- its ownership and compatibility obligations are clear

Do not use a common package as a neutral dumping ground. Prefer explicit subpath exports over
a catch-all source barrel. Prefer one public subpath per shared domain, such as
`@company/common/projects` or `@company/common/auth`, over one export for every source file.

### Create an abstraction only when

- repetition is stable and meaningful
- the abstraction removes mechanics from several call sites
- its name communicates domain or platform policy
- a change to the policy should intentionally affect every caller

Keep direct code when similarity is incidental, tiny, or likely to diverge.

### Attach cross-cutting behavior without shadow registries

- Keep each route path, event shape, job schedule, API field, and command declaration in one
  executable source of truth.
- Add generic middleware, an enhancer, or typed metadata directly beside that declaration
  when telemetry, authorization, deprecation, tracing, or policy must observe it.
- Pass a stable semantic identifier from the owner, not raw domain details reconstructed by
  generic infrastructure.
- Make the cross-cutting mechanism reusable by every domain from its first implementation.
- If another runtime needs the complete catalog, derive or generate it from the owning
  declarations. Do not hand-maintain a parallel list.

Reject a design when adding or renaming one route, event, field, or job requires editing its
owner plus a second classifier or registry for the cross-cutting concern.

### Create a separate domain only when

- it has an independent lifecycle or state machine
- it owns distinct persistence or external contracts
- it can be reasoned about without importing most of its parent domain
- its operational or product ownership is meaningfully separate

Otherwise, create an internal facet of the existing module.

## Guardrails

- Preserve public APIs by default. Treat GraphQL, REST, event payloads, package exports, and
  database contracts as compatibility surfaces.
- Separate runtime moves from domain refactors.
- Do not copy framework choices merely because the reference architecture used them.
- Do not replace the ORM solely to obtain named domain policies.
- Do not turn `index.ts` into a maintenance-heavy export inventory.
- Do not introduce auto-discovery when one explicit registry is clearer.
- Do not force browser, API, and worker code through one physical module entry.
- Do not centralize domain-specific behavior into generic infrastructure.
- Do not create domain-specific shadow registries in generic infrastructure. Instrument the
  owning declaration with a generic mechanism instead.
- Do not mirror shared domain types, constants, validation, or mappings by runtime or layer.
- Do not let a database table, GraphQL schema, or UI component own vocabulary that belongs
  to the domain.
- Do not keep authorization types in an admin or feature domain when they describe
  application-wide authority.
- Do not stack an imperative permission guard under an equivalent declarative field scope.
- Do not make a guard, resolver, route handler, or domain service reload a stable principal
  or other request fact that context construction should already own.
- Do not add no-op wrappers to public operations merely for visual uniformity.
- Do not use documentation to compensate for inconsistent executable structure.
- Do not claim simplicity from file movement alone. Show the removed decisions and seams.

## Output contracts

### Architecture analysis

Provide:

1. the current grammar and its exceptions
2. evidence-backed cognitive entropy sources
3. essential complexity that must remain
4. the target grammar
5. a small pilot recommendation
6. an incremental migration order
7. explicit non-goals

### Architecture proposal

Show the proposed directory grammar, module contract, composition root, dependency direction,
and one representative domain example. Explain which repeated decisions disappear.

### Implementation

Make one reviewable structural step at a time. Validate after each behaviorally meaningful
step. Keep mechanical moves, public contract changes, and domain rewrites in separate commits.

### Review

Lead with whether the proposal reduces or increases cognitive entropy. Identify unnecessary
layers, hidden registration, leaky boundaries, speculative generality, and compatibility risk.
Recommend the smallest correction that restores a predictable grammar.

## Final standard

Use this as the decisive test:

> After learning one domain, can a developer predict where every important part of another
> domain will be?

If yes, the architecture is working. If no, reduce variance before adding abstraction.
