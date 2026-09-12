# Canon reliability review

Baseline: `cf044c9156090990bbb4d4c51bddf882d0a41101`. Branch: `fix/long-canon-authoring`.
Review only: do not merge or deploy until reviewed.

## Root causes and changes

The shared V4 input handler serialized the entire growing state, synchronously wrote localStorage and synchronized UI on each keystroke. Storage errors were swallowed. The two canon editors now update live memory immediately, debounce persistence by 220 ms, suppress writes during composition, and flush on compositionend/change/blur. They never replace the textarea or synchronize UI while editing. Small status labels report localStorage and IndexedDB failures without reverting text. Explicit story restoration ends the previous editor session and cancels stale pending work. Story saves flush pending edits; existing draft updates use one identity-checked read/write transaction.

Previously continuation retrieval parsed only the first 40 fragments, clipped individual items to 260 characters and selected at most four. Later rules could never compete. Voice helpers also used prefix limits. The new cached local index examines every clause, retains source indices and character/block ownership, and deduplicates only exact whitespace-equivalent clauses within the same scope. Saved source strings are never rewritten.

Tier A includes detected identity, current relationship, voice/address and absolute rules. Tier B includes all clauses owned by active characters, identified primarily from direction/current beat, with recent scene/memory fallback. Other matching clauses compete across the full index. Future clauses retain dormant labels and the existing storyline/adult gates; retrieval is not evidence of fulfillment. Voice helpers refer to the attributed main block instead of duplicating a growing list. No additional API calls are introduced.

## Prompt allocation

The retrieval target is 16,000 JavaScript string characters including a 1,024-character label reserve. Core and active-character clauses are protected and can grow to a dedicated 64,000-character allocation. Optional clauses are selected whole after ranking; no prefix truncation occurs. If protected clauses exceed that allocation, prompt construction fails visibly and preserves the source instead of silently forgetting mandatory rules. These are local retrieval allocations, not a claim about total model context or measured token counts. The existing storyline roadmap is unchanged.

## Changed files

- `velour-canon-authoring.js`, `velour-canon-index.js`: editor lifecycle and deterministic retrieval.
- `velour-v4.4.38.js`: bindings, source prompt insertion, save status and draft/restore integration.
- Continuity-vault, continuity-voice-guard and scene-voice-memory hotfixes: shared retrieval and scoped voice hints.
- State-isolation hotfix: flush before its alternate save path.
- `index.html`, canonical build script and vault loader: dependency ordering/cache URLs.
- Test runtime, authoring/retrieval tests, conditional test loader, package files and node_modules ignore.

## Verification

`npm test` runs the existing conditional/age tests, full-index retrieval tests and actual V4 bindings under jsdom with fake-indexeddb. Coverage includes more than 40 and 1,000-fragment fixtures; late C occupation/voice/future rules and D prohibition; Korean names; ownership; cache invalidation; ranked budget/overflow; long Korean/punctuation/newline exact reload/story/draft/branch round trips; synthetic IME sequences; debounced write count; node/cursor preservation; beat navigation; prompt wrappers/firewall; quota and IDB abort/retry; pending edit save and restore isolation. Network generation is disabled in this fixture.

All changed JS/MJS files must pass `node --check`; `git diff --check` must pass before publication.

## Review limits

Native iPhone Safari/PWA IME behavior still needs device verification; synthetic DOM tests do not prove native keyboard behavior. Natural-language name/type/condition detection is deterministic and heuristic, not a semantic guarantee. Clear named subjects and named blocks are supported; ambiguous pronouns or unusual formatting can remain unassigned. Models can still violate instructions despite receiving the rules. Mandatory overflow deliberately blocks generation rather than reducing saved canon. No new paid model request or live generated story was used for QA. Existing crossover styling and response-vault/branch logic are not redesigned.
