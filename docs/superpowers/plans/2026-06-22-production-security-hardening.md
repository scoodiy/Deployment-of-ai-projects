# Production Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ayuu.fun production service recoverable after a database failure and reduce its network, authentication, upload, and dependency attack surface.

**Architecture:** Apply isolated, reversible hardening phases. Database backup and permissions are first because they do not change request routing. Application, Nginx, and SSH changes each receive independent validation so a failed layer can be reverted without compromising site availability.

**Tech Stack:** Ubuntu, SQLite, Bash, Next.js 16, PM2, Nginx, UFW, OpenSSH.

---

### Task 1: Reliable SQLite backups

**Files:**
- Modify: `ops/backup.sh`
- Test: `tests/backup-script.test.ts`

- [ ] Add a failing source-contract test that requires `umask 077`, `sqlite3`, an integrity check, and refusal to copy a live database without SQLite.
- [ ] Install the `sqlite3` package on Ubuntu.
- [ ] Change `ops/backup.sh` to create an SQLite online backup, validate it with `PRAGMA integrity_check`, then gzip it.
- [ ] Run a manual backup, restore it to `/tmp`, and run `PRAGMA integrity_check` on the restored file.
- [ ] Commit the script and test.

### Task 2: Database and secret permissions

**Files:**
- Modify: deployment file permissions only

- [ ] Set `.env` and `data/ayuu.db` to `0600`.
- [ ] Set `data` and `ops/backups` to `0700`; set existing compressed backups to `0600`.
- [ ] Verify the PM2 process still serves `/` and that the scheduled backup succeeds.

### Task 3: Application and upload safety

**Files:**
- Modify: `app/api/user/upload/route.ts`
- Modify: `app/api/admin/media/upload/route.ts`
- Modify: PM2 application environment
- Test: `tests/upload-validation.test.ts`

- [ ] Add failing tests for signature validation and disallowed SVG uploads.
- [ ] Validate upload signatures before writing files, disallow SVG, and return generic errors.
- [ ] Bind `next start` to `127.0.0.1:3000`; verify Nginx remains the only public HTTP entry point.
- [ ] Reload PM2 and run public health checks.

### Task 4: Nginx and SSH hardening

**Files:**
- Modify: `/etc/nginx/sites-enabled/ayuu.fun`
- Create: `/etc/ssh/sshd_config.d/20-security.conf`

- [ ] Add HSTS, clickjacking, MIME-sniffing, referrer, and permissions-policy headers; add scoped login/upload rate limits.
- [ ] Validate Nginx syntax, reload Nginx, and inspect response headers.
- [ ] Create a named sudo user with the existing administrator key and verify a second SSH session.
- [ ] Disable SSH password authentication and root password login only after the new session works; validate with `sshd -t` and retain the original root session until confirmation.

### Task 5: Dependency remediation

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] Upgrade Next.js to a patched compatible release and run build plus smoke tests.
- [ ] Record Gitalk's unpatched Axios dependency as a replacement/containment task instead of force-upgrading it blindly.
