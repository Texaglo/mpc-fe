# Production hardening plan — four-day launch window

Last audited: August 30, 2026
Scope: admin panel, active Node backend, Unity-facing ring/wallet/auth routes

## Completed in the current launch pass

- Preserved the existing Unity route names and request/response fields for ring join/leave, wallet, authentication, socket and time-burn flows.
- Added reasoned balance, cashier, session, global game-join and table controls with structured audit records.
- Made Cash, MPCE/Time and FP table stack settlement follow the stored table/player economy without renaming Unity's `mpceCredit` stack field.
- Prevented active-hand opponent cards from being disclosed through admin history APIs.
- Added authenticated socket presence and immediate socket termination when an account is frozen or force-logged-out.
- Added operational dashboard counts, separated liabilities, revenue basis and system status.
- Full backend validation is green: 35 Jest suites passed (351 tests), all six isolated live socket/game E2E scenarios passed, the 30-player Free Play stress passed, and the admin production build completed.
- Isolated Jest and live-E2E databases now use explicit test database names with a fail-closed URI guard.
- The Unity team branch compiles under its exact 6000.4.9f1 editor, passes the Cash/FP selector and compatibility assertions, and produces a development WebGL player build.

## P0 gates that must close before production traffic

1. **Remediate vulnerable dependencies.** The current audits report 9 critical/56 high findings in the backend and 3 critical/50 high findings in the admin. Upgrade Solana/Web3, React/build tooling and transitive packages in controlled groups with the full regression suite after each group. Do not use `npm audit fix --force`.
2. **Fix the failed NFT safety index.** Startup reports a duplicate normalized Ethereum transaction hash, so the intended unique index is not enforced. Export the collisions, choose the canonical record, quarantine duplicates, then rebuild and verify the index.
3. **Lock the production perimeter.** Provide `SESSION_SECRET` from the secret manager, configure valid TLS certificates, restrict CORS to approved admin/game origins, disable or protect Swagger, and verify production never falls back to HTTP.
4. **Run controlled custody E2E.** On staging/devnet, exercise deposit → time purchase → table burn → house ledger and separately hot-wallet refill request/approval → withdrawal payout, including insufficient funds, fee reserve, retry and duplicate-click cases. Do not use production treasury keys for this test.

## Four-day execution sequence

### Day 1 — environment and data safety

- Confirm the isolated dev/test/staging/prod databases and credentials in CI and deployment configuration.
- Begin dependency upgrades in bounded groups, prioritizing reachable critical custody/authentication paths.
- Enforce required production secrets and TLS at boot; restrict CORS and API docs.
- Resolve the duplicate NFT index and verify every required unique/index constraint.
- Snapshot and test database restore; record recovery time and recovery point.

Exit gate: a production-mode boot fails closed when any required secret, certificate, database, index or wallet configuration is invalid.

### Day 2 — financial and authorization correctness

- Run concurrent/idempotency tests for deposits, time purchases, balance adjustments, table buy-ins/cash-outs, burns, hot-wallet refills and withdrawals.
- Verify every privileged mutation requires a reason and produces an immutable audit delta.
- Test freeze/force-logout across HTTP and live Unity sockets.
- Reconcile player liabilities, house MPCE, treasury and hot-wallet balances against raw transaction records.

Exit gate: repeated requests and partial provider failures cannot double-credit, double-debit or double-send.

### Day 3 — compatibility, load and failure drills

- Run the current Unity client against staging through join, reconnect, play, burn, leave and withdrawal-request flows.
- Load-test authenticated sockets, dashboard aggregation and ring lifecycle at expected peak plus 2× headroom.
- If deploying multiple Node processes, move presence/session fan-out to the shared Socket.IO/Redis adapter before relying on global counts.
- Inject RPC timeout, database latency, socket reconnect and process restart failures; confirm safe recovery.

Exit gate: no Unity contract regression, no lost stack/refund, and no financial divergence after restart or retry.

### Day 4 — staging soak and release decision

- Deploy the exact release candidate to production-like staging for a minimum four-hour soak.
- Run the route smoke suite and controlled custody E2E against that artifact.
- Verify alerts, logs, backups, wallet thresholds, cashier/game kill switches and rollback procedure.
- Freeze changes, capture database/index state, sign off balances, then release with an operator watching metrics and custody queues.

Exit gate: all P0 gates are evidenced and signed; rollback can be completed without losing ledger records.

## Required monitoring and alerts

- API error rate/latency, Mongo connectivity and slow queries.
- Authenticated socket count, reconnect rate and disconnect-cleanup failures.
- Deposit confirmation lag, withdrawal/refill failures, payout retries and hot-wallet fee reserve.
- Negative-balance attempts, ledger-write rollback failures and liability/reconciliation variance.
- Burn scheduler delay, house MPCE transfer failures and table runtime persistence errors.

## Compatibility contract

- Do not rename or remove current Unity endpoints.
- Keep legacy JWTs as version zero until the account is explicitly revoked.
- Keep the ring stack wire field named `mpceCredit`; `balanceType` selects the backing account server-side.
- Keep time burn expressed through the existing Unity-compatible minute projection while canonical accounting uses one MPCE balance.
- Additive response fields are allowed; existing required fields and success/error codes must remain stable until a coordinated Unity release.
