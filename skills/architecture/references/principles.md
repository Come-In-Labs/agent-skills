# Principles of low-entropy architecture

## Contents

1. Complexity distribution
2. Recognition over recall
3. Locality and conceptual integrity
4. Stable shapes at every scale
5. Explicit composition
6. Semantic compression
7. Defaults as architecture
8. Directness and abstraction
9. Large domains
10. Documentation and executable truth
11. What not to copy
12. Evaluation model

## 1. Complexity distribution

Do not evaluate a codebase only by total complexity. Evaluate where complexity appears and
how many developers must repeatedly confront it.

A strong system accepts sophisticated framework code when that code compresses stable,
repeated mechanics for every domain. Transaction routing, schema composition, loader
creation, permission evaluation, and test rollback may be complex internally. Feature code
should consume them through small, consistent interfaces.

Prefer:

```text
complex foundation, many simple domains
```

over:

```text
simple foundation, every domain manually reconstructs the same mechanics
```

Measure amortization. A foundation is valuable when many domains become simpler because of
it. A foundation used once is usually indirection.

A boundary wrapper is valuable when it removes the same prerequisite ceremony from many
domain bodies. Its job is to validate and strengthen an already-prepared input. If the
wrapper secretly reconstructs that input, complexity moved out of sight rather than being
compressed.

## 2. Recognition over recall

Minimize facts a developer must remember. Repeat the same visible structure so developers
recognize where they are.

Good architectural conventions answer navigation questions without search:

- the feature is under its domain name
- its entry describes runtime participation
- its API is under one predictable path
- its persistence behavior is near the domain model
- its tests are colocated
- one root lists the installed modules

The goal is not uniform file names for their own sake. The goal is a reliable answer to the
same question across domains.

Treat every exception as cognitive cost. Keep an exception when it represents real product
or runtime difference. Remove it when it only reflects the history of who implemented the
feature.

## 3. Locality and conceptual integrity

Organize by what the product does, not only by technical mechanism.

Prefer:

```text
domains/projects/graphql
domains/projects/models
domains/projects/jobs
domains/projects/policies
```

over a system where one change requires navigating independent global directories for
controllers, services, repositories, routes, schemas, validators, workers, and tests.

Keep infrastructure shared when it is genuinely cross-cutting. Keep product behavior in its
domain even when another domain has superficially similar code.

Apply the change-radius test: a normal feature change should mostly affect one domain and
one composition seam. If it routinely touches several unrelated roots, registration or
ownership is leaking.

Give shared vocabulary the same locality. A status, role, event kind, audience shape, or
state transition has one canonical owner even when app, API, worker, and database code all
consume it. Keep the pure contract with the owning domain and keep runtime mechanics in that
domain's runtime implementation.

Do not create parallel names for one meaning merely to make each layer look independent.
`ProjectStatus`, `ProjectStatusName`, and `WorkerProjectState` are not separate contracts when they carry
the same values and semantics. A second type is justified only by a real semantic boundary,
with an explicit conversion at that boundary.

## 4. Stable shapes at every scale

Use the same conceptual grammar for small and large domains.

A small domain may have one GraphQL file. A large domain may compose twenty GraphQL facets.
Both should still expose one `graphql` capability through one module entry.

Do not respond to growth by inventing a new architecture for the large domain. Split by
capability while preserving the same public module shape.

Stable shapes improve:

- onboarding
- code review
- automated refactoring
- agent performance
- ownership discovery
- test placement
- architectural enforcement

## 5. Explicit composition

Expose the complete installed system in one obvious root.

Prefer a typed list:

```ts
export const modules = [Auth, Projects, Teams, Notifications] satisfies Module[];
```

over scanning directories, import side effects, hidden decorators, or several unrelated
registries.

Explicit composition makes ordering, omission, and dependency visible. Generic composition
then removes domain-specific setup from the root:

```ts
composeGraphql(schema, modules);
mountRoutes(router, modules);
registerJobs(worker, modules);
```

Keep the root boring. It should know which modules exist, not how each domain implements its
capabilities.

## 6. Semantic compression

Abstract repetition when the abstraction introduces vocabulary that preserves meaning.

Good semantic compression:

```ts
visibleTo(viewer)
activeAt(now)
openForRegistration(now)
hasPermissions(user, ['projects.manage'])
```

Weak compression:

```ts
findProjectById(id) // only renames a one-line ORM query
executeQuery(query) // hides a library without adding policy
BaseDomainService<T> // generalizes unrelated domains
```

Name stable domain policies. Leave incidental mechanics direct. The call site should tell a
business story without hiding important cost, authorization, or transaction behavior.

## 7. Defaults as architecture

The default path is more influential than written policy. Put correctness and consistency
there.

Examples:

- automatically roll back ordinary integration tests
- create request-scoped data loaders by default
- hydrate stable request identity, roles, capabilities, tenant, locale, and transaction
  facts before dispatch
- let boundary enhancers validate and type-narrow prepared context
- validate module schema and resolver compatibility during startup
- make the standard API guard accept a permission requirement
- expose one transaction-aware database entry
- prevent shared packages from importing runtime-specific dependencies

This default applies to every domain: define cross-runtime vocabulary once, then let each
runtime implement persistence, side effects, and protocol behavior without redefining the
concept.

Authorization is one concrete example. Define cross-runtime vocabulary once, enforce it in
the auth boundary, and express fixed requirements declaratively at the protocol boundary.
Use an imperative guard only when the protocol cannot express the requirement or the
required permission is computed at runtime. Use a boolean predicate when authorization
changes projection or visibility instead of rejecting the operation.

Do not expose raw permission storage as the normal API. If every caller loads a set and
calls `.has()`, permission semantics, superuser behavior, caching, and error handling will
drift back into consuming domains.

Provide explicit escape hatches for exceptional tests and operations. Name them so the
exception is visible in review.

Avoid a default that requires every caller to remember cleanup, permission checks, loader
batching, or transaction propagation. Repeated human discipline is not a reliable system.

Use this as a general boundary rule, not an auth-only convention:

```text
hydrate once -> validate at the boundary -> consume the narrowed context
```

Apply it to stable request-wide prerequisites. Do not use it to preload every possible
domain entity or create a service locator. Context contains broadly shared request facts;
domains still own their specific data and policy.

## 8. Directness and abstraction

Prefer the shortest path that preserves a real boundary.

A resolver may call a domain model or an orchestration service directly. Do not require a
controller, use case, service, repository, data access object, and adapter when most layers
only forward arguments.

Introduce a layer for one of these reasons:

- it owns a protocol boundary
- it coordinates several domain operations and side effects
- it contains meaningful policy or branching
- it provides a stable testable contract across runtimes
- it isolates an external integration
- it centralizes a repeated platform mechanism

Delete a layer when its only purpose is naming another layer.

## 9. Large domains

Separate conceptual size from file size.

A large domain can remain coherent when its internal parts share:

- lifecycle
- persistence
- vocabulary
- API ownership
- authorization model
- operational ownership

Split internals by entity or capability. Keep one public entry that composes them.

Extract a new domain when it can own its lifecycle and contract independently. Avoid both a
single god file and a network of tiny modules whose dependencies recreate the original
domain invisibly.

## 10. Documentation and executable truth

Make architecture visible in code first. Use documentation for rationale, compatibility
windows, operational procedures, and complex domain concepts.

Do not require a developer to read several dated plans to learn where a resolver is
registered or how a test is isolated. Those facts should be obvious from the current module
shape and test harness.

Maintain one current architecture description. Extract durable decisions from completed
plans, then archive or remove obsolete plans.

## 11. What not to copy

Separate principles from incidental implementation choices.

Do not copy these solely because a successful reference system used them:

- a particular ORM
- decorators
- class-based modules
- Koa, Express, Apollo, Yoga, or another transport
- global application mutation
- module augmentation
- a specific directory spelling
- legacy type escapes

Reproduce the outcomes:

- predictable domain homes
- manifest-like entries
- explicit composition
- readable APIs
- canonical ownership for shared concepts
- semantic persistence vocabulary
- generic authorization
- automatic correctness defaults

## 12. Evaluation model

Score a proposed or existing architecture from 0 to 2 for each dimension:

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Domain locality | behavior scattered globally | mostly local with leaks | one obvious home |
| Entry clarity | no public entry | barrel or partial entry | manifest reveals participation |
| Composition | hidden or repeated | partly centralized | one explicit typed root |
| API readability | implementation must be decoded | partially visible | contract visible before internals |
| Concept ownership | same meaning mirrored by layer | partial shared contracts | one owner and name per meaning |
| Authorization | specialized or inline checks | mixed generic and bespoke | generic permission vocabulary |
| Context and boundaries | setup repeated in domain bodies | shared context without reliable narrowing | complete context plus validating, type-narrowing boundaries |
| Test defaults | cleanup is manual | partial automation | rollback and reset are automatic |
| Runtime boundaries | cross-import leakage | documented exceptions | enforced dependency direction |
| Predictability | every domain differs | recognizable clusters | one grammar with justified exceptions |

Interpret totals carefully:

- **17 to 20:** low entropy, preserve the grammar
- **12 to 16:** coherent base with specific leaks
- **7 to 11:** architecture depends on local knowledge
- **0 to 6:** developers must reconstruct the system repeatedly

Use the score to locate variance, not to manufacture a universal benchmark.
