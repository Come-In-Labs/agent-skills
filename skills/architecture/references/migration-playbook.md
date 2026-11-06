# Incremental architecture migration playbook

## Contents

1. Migration posture
2. Baseline and boundaries
3. Select the pilot
4. Establish contracts
5. Convert one domain
6. Validate ergonomics
7. Expand deliberately
8. Move runtimes safely
9. Simplify documentation
10. Commit strategy
11. Failure modes
12. Completion checklist

## 1. Migration posture

Preserve behavior while changing structure. Treat architecture migration as a sequence of
small proofs, not a repository rewrite.

Keep these concerns separate when possible:

- runtime directory moves
- module contract introduction
- GraphQL implementation changes
- public API changes
- persistence refactors
- test harness changes
- shared package extraction

Combining them makes review and rollback harder and hides which change produced value.

## 2. Baseline and boundaries

Before editing:

1. Record the current typecheck and test baseline.
2. Identify the deployed branch and shipped API consumers.
3. Map runtime dependency direction.
4. Find every composition root and registration seam.
5. Count how many files a normal domain addition changes.
6. Identify one existing domain whose structure developers already prefer.
7. List essential complexity and compatibility constraints.

Write explicit non-goals. Common non-goals include replacing the ORM, rewriting every
GraphQL domain, moving all runtimes, or breaking legacy routes.

## 3. Select the pilot

Choose a pilot that is:

- small enough to understand completely
- representative of ordinary API and persistence work
- covered by integration tests
- internally coherent
- low in compatibility risk
- not the application's largest domain

Avoid a trivial health endpoint because it proves too little. Avoid the central mega-domain
because failures reveal too many variables at once.

Define success before editing:

- one domain entry
- one registry addition
- one generic composition path
- readable API contract
- preserved behavior
- no new runtime dependency leak
- tests using the normal isolation path

## 4. Establish contracts

Introduce the smallest contract needed by the pilot:

```ts
export type Module = {
  graphql?: GraphqlModule;
};
```

Add a typed module registry. Add one generic composer. Convert the pilot to satisfy the
contract.

Do not add routes, jobs, loaders, events, migrations, and lifecycle fields before converting
a domain that needs them. Let proven usage evolve the contract.

Keep generic composers independent of specific domains. The schema root may import the
module registry, but it should not import the pilot's resolver internals.

## 5. Convert one domain

Perform the conversion in reviewable steps:

1. Create the domain entry as a manifest.
2. Move or adapt API definitions under the domain.
3. Express resolvers in the standard map shape.
4. Move duplicated domain vocabulary, pure mappings, validation, and event contracts to one
   canonical owner. Use common only when multiple runtimes consume the same meaning.
5. Make database schemas, API definitions, UI, and workers consume the canonical vocabulary
   without layer-specific aliases. Keep runtime mechanics in the owning runtime domain.
6. For authorization specifically, keep permission loading and evaluation in the auth
   domain. Replace specialized helpers and raw permission-set inspection with the narrow
   generic auth API.
7. Hydrate stable request identity and authorization facts in protocol context construction,
   not in individual resolvers or guards.
8. Use declarative protocol authorization for static requirements. For SDL, wrap resolvers
   with a generic enhancer that validates and narrows the prepared context. Keep inline
   imperative guards only for genuinely dynamic requirements and boolean checks for soft
   visibility.
9. Register the domain once.
10. Remove old domain-specific root wiring.
11. Keep compatibility fields and routes intact.
12. Run targeted types and integration tests.

Avoid opportunistic cleanup outside the domain. Record follow-up candidates separately.

## 6. Validate ergonomics

Do not validate only compilation. Use the pilot as a human-factors test:

- Open the domain entry. Does it show all runtime participation?
- Open the GraphQL entry. Can the API be read without chasing builders?
- Add a temporary field mentally. Is the edit location obvious?
- Trace permission evaluation. Is there one generic mechanism plus clear entity policy?
- Inspect a guarded resolver. Does its wrapper receive an already-complete principal and
  expose a non-null user to a body with no setup preamble?
- Inspect a public resolver. Is it simply unwrapped instead of hidden behind a no-op helper?
- Trace a shared concept from UI through API, database, and worker. Is its meaning and name
  defined once under the real owning domain?
- Inspect static API fields. Is authorization declarative rather than repeated in resolver
  bodies?
- Trace a database call. Does it use the normal context and transaction?
- Inspect a test. Does rollback happen without test-body ceremony?
- Remove the domain from the registry mentally. Would all its contributions disappear?

If the pilot still requires several root edits or architecture explanations, refine the
contract before migrating another domain.

## 7. Expand deliberately

Convert a second domain with somewhat different needs. Use it to test whether the grammar is
general or merely tailored to the pilot.

Add a new module capability only when the second domain demonstrates the need. Keep the
contract structurally typed and small.

Migrate in clusters that preserve product ownership. Do not partially convert every domain
at once. A complete converted domain is a usable exemplar. Many half-converted domains
increase entropy.

Handle the large domain after the grammar has survived several smaller ones. Split its
GraphQL and internal operations by capability while retaining one module entry.

## 8. Move runtimes safely

Treat root-to-`apps/` moves as mechanical migrations:

1. Move one runtime.
2. Update workspace definitions.
3. Update TypeScript aliases.
4. Update build and development scripts.
5. Update Docker stages and copy paths.
6. Update CI and deployment paths.
7. Update test and code generation configuration.
8. Build the affected runtime in its production mode.
9. Commit before moving another runtime.

Do not mix a runtime move with domain restructuring. Path churn obscures semantic changes.

## 9. Simplify documentation

After executable structure is stable:

1. Update one current architecture document.
2. Preserve operational guides and lasting decision records.
3. Extract durable rationale from completed plans.
4. Archive or remove obsolete migration plans.
5. Ensure root instructions describe the structure that actually exists.

Avoid documenting every file. Document the grammar, boundaries, compatibility rules, and
exceptions.

## 10. Commit strategy

Use small commits with one architectural claim each:

```text
test: make transaction rollback the integration default
refactor(auth): centralize permission guards
refactor(graphql): pilot schema-first domain module
refactor(graphql): compose typed domain modules
refactor(projects): split GraphQL by capability
```

Keep generated artifacts with the schema or operation change that requires them. Keep
mechanical moves separate from semantic changes.

Validate each commit at the risk level it introduces. Run production builds when paths,
bundles, or containers change.

## 11. Failure modes

### Designing the final framework first

Symptom: a rich module interface appears before any domain uses most fields.

Correction: reduce to the pilot's actual capabilities and evolve from evidence.

### Turning entries into barrels

Symptom: every internal helper is re-exported through nested indexes.

Correction: keep the entry focused on runtime participation and intentional public contracts.

### Moving files without removing seams

Symptom: domains have tidy folders but root files still know every resolver, route, and job.

Correction: complete generic composition and remove domain-specific root knowledge.

### Genericizing domain policy

Symptom: a universal base service needs flags and callbacks for each domain.

Correction: keep shared mechanics generic and domain policy local.

### Hiding dependencies

Symptom: filesystem scanning or global service lookup makes modules appear independent while
dependencies remain implicit.

Correction: use explicit registries and typed request context.

### Breaking contracts during cleanup

Symptom: schema fields, routes, event payloads, or package exports are renamed as part of a
structural refactor.

Correction: preserve the old surface, add the new path when needed, and use a deprecation
window in a separate change.

### Disabling test isolation broadly

Symptom: many tests opt out because the harness cannot route ordinary queries correctly.

Correction: fix the stable public database seam. Reserve committed mode for actual
cross-connection semantics.

### Creating a common dumping ground

Symptom: the common package imports React, the ORM, server environment, or worker libraries.

Correction: enforce pure contracts and one-way runtime dependencies.

### Centralizing mechanics but not vocabulary

Symptom: runtime helpers are centralized, but app, server, worker, API, and database schema
still define aliases or mirrors for the same status, event, role, capability, or input
contract.

Correction: assign the concept to its real domain, move the pure cross-runtime contract to
that domain's common entry, and make every layer consume it. Keep runtime implementation in
the owning runtime domain.

### Imperative checks over declarative scopes

Symptom: static GraphQL fields declare only `authenticated`, then every resolver calls a
permission helper manually.

Correction: put the fixed capability in the field's declarative auth scope. Keep `guard()`
for SDL or dynamic requirements and `hasPermissions()` for soft decisions.

### Guards as hidden context loaders

Symptom: every resolver starts by awaiting a guard that also fetches the user, roles,
permissions, tenant, locale, or transaction before domain work can begin.

Correction: hydrate stable request-wide facts during protocol context construction. Make
the boundary enhancer validate and type-narrow that prepared context, then let the resolver
body use it directly. Keep rare entity data in its domain rather than inflating context.

## 12. Completion checklist

### Structure

- [ ] Each converted domain has one obvious home.
- [ ] Each converted domain has one manifest-like entry.
- [ ] Large domains compose internal facets behind the same entry shape.
- [ ] Runtime-specific code remains in its runtime.

### Composition

- [ ] One typed registry lists installed modules.
- [ ] Generic composers own GraphQL, routes, jobs, or loaders as needed.
- [ ] Roots contain no converted-domain-specific wiring.
- [ ] Ordering dependencies are visible and justified.

### API and policy

- [ ] Public API shape is preserved or migrated additively.
- [ ] API definitions are readable before implementation details.
- [ ] Every shared concept has one canonical owner, name, and public path.
- [ ] Database, API, UI, and worker layers consume rather than mirror domain vocabulary.
- [ ] A second type exists only for a real semantic boundary with explicit conversion.
- [ ] Permissions use one generic vocabulary where semantics match.
- [ ] Capability and role names have one source of truth across runtimes.
- [ ] Static API permissions use declarative protocol scopes where available.
- [ ] Ordinary consumers do not load and inspect raw permission sets.
- [ ] Entity-specific visibility and ownership remain explicit policies.

### Persistence and context

- [ ] Meaningful repeated query policy has a domain name.
- [ ] Trivial ORM calls remain direct.
- [ ] Stable request identity and authorization facts are hydrated once before dispatch.
- [ ] Boundary wrappers validate and narrow context without loading it.
- [ ] Guarded domain bodies have no repeated authentication or context setup preamble.
- [ ] Intentionally public operations remain visibly unwrapped.
- [ ] Request dependencies do not travel through forwarding layers.
- [ ] Shared packages contain no runtime-specific imports.

### Tests and validation

- [ ] Ordinary integration tests roll back automatically.
- [ ] Isolation opt-outs correspond to real commit or connection behavior.
- [ ] Targeted integration tests pass.
- [ ] Typecheck, lint, and relevant production builds pass.

### Human factors

- [ ] A developer can identify where to add a field, route, job, and test.
- [ ] Adding one domain requires one registry edit.
- [ ] The number of architectural shapes decreased.
- [ ] Current architecture no longer depends on plan archaeology.
- [ ] One converted domain serves as a complete exemplar.
