# Firebase Realtime Database hardening guide

This repo now includes a secure baseline RTDB ruleset in `database.rules.json`.

## Security posture

- Deny-by-default at the root (`.read` and `.write` are both `false`).
- Per-user isolation for `users/$uid` and `profiles/$uid`.
- Owner-only writes for `sessions/$sessionId` with immutable ownership.
- Admin-only access for the `admin` branch via custom claims (`auth.token.admin`).

## Why this is safer

1. Prevents anonymous or accidental global reads/writes.
2. Restricts each authenticated user to their own records.
3. Stops ownership takeover by disallowing `ownerUid` changes after create.
4. Separates privileged data into an admin-only branch.

## Deploy rules

```bash
firebase deploy --only database
```

If your Firebase project uses a non-default rules file name, point `firebase.json` at `database.rules.json`.

## Validate with emulator

```bash
firebase emulators:start --only database
```

Then run your read/write flows and verify:

- unauthenticated read/write is denied;
- user A cannot read user B nodes;
- users can create/update their own sessions;
- `ownerUid` cannot be changed;
- admin paths require custom claim `admin: true`.

## Optional next hardening steps

- Add per-field validation for every writable node.
- Add bounded string lengths for user-generated text fields.
- Split private vs public profile fields into separate branches.
- Add server-side write paths (Cloud Functions / trusted backend) for sensitive transitions.
