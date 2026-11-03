---
category: "Laravel"
tags: ["Laravel", "Pest PHP", "PostgreSQL", "Windows", "Testing"]
date: "2026-11-03"
author: "Punyapal Shah"
author_url: "https://x.com/MrPunyapal"
subcategory: "Testing"
---

# Fixing Slow and Failing Laravel Pest Parallel Tests on Windows

> Parallel Pest runs on Windows often fail with WIN1252 encoding errors or out of shared memory lock crashes. Here is how to configure PostgreSQL, OpenSSL, and your build pipeline for fast, reliable parallel testing.

You sit down at a workstation with 20 logical CPU cores, run `php vendor/bin/pest --parallel`, and watch workers either choke immediately or take three times longer than your team's budget continuous integration box. Adding more workers makes the run slower, not faster. Eventually, workers crash with cryptic encoding mismatches or shared memory lock errors.

When this happens, developers often assume Pest, ParaTest, or the test suite itself is broken on Windows. That assumption is almost always wrong. The application code and tests are usually completely healthy.

The failures come directly from your local Windows runtime environment. Out of the box, standard Windows installations of PostgreSQL (including stacks managed by DBngin or standalone installers) initialize databases using code page WIN1252. The default PostgreSQL lock table is sized for modest single-threaded development, not twenty concurrent database migrations dropping dozens of tables simultaneously. Missing default OpenSSL configuration files, interrupted vendor installations, and unbuilt frontend assets cause isolated assertions to crash.

Fixing these five friction points transforms a broken, sluggish test run into an execution suite that finishes in under two and a half minutes across thousands of tests.

---

## TL;DR Checklist

Run through this checklist to unblock your local test run:

1. **Repair vendor dependencies**: Run `composer install` to ensure Amp and ParaTest process worker files are fully written to disk.
2. **Rebuild PostgreSQL template1 as UTF-8**: Drop and recreate `template1` from `template0` using `UTF8` encoding and `C` collation so parallel test databases clone correctly.
3. **Increase Postgres lock capacity**: Raise `max_locks_per_transaction` to `512` in `postgresql.conf` to handle concurrent `migrate:fresh` operations.
4. **Supply an OpenSSL configuration file**: Point PHP to an `openssl.cnf` file via the `OPENSSL_CONF` environment variable or copy it into `C:\Program Files\Common Files\SSL\`.
5. **Build frontend assets**: Run `bun run build` (or `npm run build`) so Inertia and Blade feature tests can read `public/build/manifest.json`.
6. **Re-run the parallel suite**: Execute `php vendor/bin/pest --parallel` and confirm clean execution.

---

## 1. PostgreSQL Initialized with Windows-1252

### The Problem

When PostgreSQL is installed on Windows, the initialization utility (`initdb`) samples the operating system's regional locale. On English Windows installations, this typically defaults to code page 1252 (`WIN1252`). When the cluster initializes, the default database template, `template1`, inherits `WIN1252`.

When you run `pest --parallel`, ParaTest boots independent worker processes. Laravel's parallel testing package creates a distinct database for each worker (for example, `testing_test_1`, `testing_test_2`, up to `testing_test_20`). Laravel explicitly executes:

```sql
CREATE DATABASE testing_test_1 WITH ENCODING 'utf8';
```

In PostgreSQL, every `CREATE DATABASE` statement clones `template1` by default unless an explicit template is specified. When Postgres tries to create a `UTF8` database from a `WIN1252` template, it fails with this error:

```text
SQLSTATE[22023]: Invalid parameter value: 7 ERROR: new encoding (UTF8) is incompatible with the encoding of the template database (WIN1252)
```

Linux CI runners initialize PostgreSQL clusters directly inside Docker containers configured with `en_US.UTF-8` or `C.UTF-8`. As a result, CI runs without issue while local Windows runs fail immediately.

### Diagnosis

Connect to your local Postgres server using your preferred SQL client or `psql` and inspect your existing database catalog:

```sql
select datname,
       pg_encoding_to_char(encoding) as encoding,
       datcollate,
       datctype,
       datistemplate
from pg_database
order by datname;
```

Look at the rows for `template1` and `testing`. If their encoding column reports `WIN1252`, any parallel database creation requiring UTF-8 will abort.

### Fix (One-Time, Cluster-Level)

To fix this permanently for all future databases created on your local cluster, you must rebuild `template1` using `template0`. `template0` is the pristine, immutable template database created during cluster initialization that has no custom schema modifications.

Connect to the default `postgres` database as a superuser (such as `postgres`). Make sure no other client or service is connected to `template1` or your test database, then run:

```sql
-- Terminate any active connections to template1 and testing
select pg_terminate_backend(pid)
from pg_stat_activity
where datname in ('template1', 'testing')
  and pid <> pg_backend_pid();

-- Temporarily mark template1 as a standard database so it can be dropped
update pg_database set datistemplate = false where datname = 'template1';
drop database template1;

-- Recreate template1 using template0 as the source, forced to UTF8
create database template1
  with template = template0
  encoding = 'UTF8'
  lc_collate = 'C'
  lc_ctype = 'C';

-- Restore template1 status
update pg_database set datistemplate = true where datname = 'template1';

-- Recreate the primary testing database under UTF8
drop database if exists testing;
create database testing
  with template = template0
  encoding = 'UTF8'
  lc_collate = 'C'
  lc_ctype = 'C';
```

Using `C` collation for test templates offers deterministic byte-order sorting and significantly reduces locale-string overhead during high-volume database operations. If your application specifically relies on locale-sensitive linguistic sorting in test assertions, substitute an appropriate UTF-8 locale, but ensure that collation remains consistent between single and parallel test runs.

Rebuilding `template1` does not touch or corrupt existing databases (such as your main development application database). Only databases created after this change inherit the new UTF-8 encoding.

*(Temporary workaround note: If you cannot modify `template1` due to strict multi-user permissions, you can manually pre-create worker databases like `testing_test_1` through `testing_test_20` with `TEMPLATE template0 ENCODING 'UTF8'`. However, this is fragile and requires manual maintenance whenever worker counts change).*

### Verification

Run the verification query:

```sql
select datname, pg_encoding_to_char(encoding) as encoding, datcollate
from pg_database
where datname in ('template1', 'testing');
```

Confirm that both databases now report `UTF8` in the `encoding` column.

---

## 2. `max_locks_per_transaction` is Too Small for Parallel Workers

### The Problem

When running parallel tests with Laravel's `RefreshDatabase` trait, each worker runs database migrations to ensure its schema is synchronized. In parallel execution, 16 or 20 workers hit PostgreSQL at the exact same moment.

When `migrate:fresh` runs across all workers, each process drops tables, constraints, sequences, and indexes simultaneously. In PostgreSQL, lock table allocations are stored in a fixed-size shared memory array calculated at startup. The size of this tracking table is determined roughly by:

$$\text{Lock Table Size} \approx (\text{max\_connections} + \text{max\_prepared\_transactions}) \times \text{max\_locks\_per\_transaction}$$

The default value of `max_locks_per_transaction` is `64`. When 20 workers concurrently acquire exclusive locks on dozens of tables and indexes during schema teardowns, PostgreSQL exhausts its shared lock slots. You will see workers crash with:

```text
SQLSTATE[53200]: Out of memory: 7 ERROR: out of shared memory
HINT: You might need to increase "max_locks_per_transaction".
```

### Diagnosis

Check your current PostgreSQL lock configuration:

```sql
select name, setting, unit
from pg_settings
where name in (
  'max_locks_per_transaction',
  'max_connections',
  'shared_buffers'
);
```

If `max_locks_per_transaction` is set to `64`, your database cannot reliably handle 16 to 20 workers concurrently migrating complex schemas.

### Fix

Locate your active configuration file by running:

```sql
show config_file;
```

Open `postgresql.conf` in an editor and update the setting:

```ini
max_locks_per_transaction = 512
```

Save the file and restart your PostgreSQL server using the control mechanism appropriate for your setup:
- If using **DBngin**, click Stop and then Start on the PostgreSQL service.
- If using **Laravel Herd Pro Services**, toggle the PostgreSQL service off and on.
- If running as a standard **Windows Service**, run `Restart-Service postgresql*` in an elevated PowerShell session.

> **Warning regarding Windows restarts**: Avoid running `pg_ctl restart` inside non-interactive PowerShell processes or background agent runners. The detached process can inherit the parent console standard output handle and appear to hang indefinitely. Furthermore, if the PostgreSQL process underwent an unclean shutdown, Windows PostgreSQL may spend several minutes performing crash recovery and directory tree fsync operations before opening its network port. Use your GUI service manager or Windows Service controller to restart cleanly.

### Verification

Once PostgreSQL is back online, query the runtime value:

```sql
show max_locks_per_transaction;
```

The output should now read `512`.

*(Note: Dropping worker counts via `--processes=8` can reduce lock pressure, but increasing `max_locks_per_transaction` directly is the permanent solution that allows your test suite to fully utilize modern multi-core hardware).*

---

## 3. PHP Has No OpenSSL Config

### The Problem

If your application interacts with GitHub Apps, signed JWTs, asymmetric encryption, or API token generation, your tests likely invoke `openssl_pkey_new()` or related OpenSSL functions.

On Linux, OpenSSL locates system configuration files in standard locations such as `/etc/ssl/openssl.cnf`. On Windows, the OpenSSL library compiled into PHP searches for `openssl.cnf` at a hardcoded compiled path:

```text
C:\Program Files\Common Files\SSL\openssl.cnf
```

If that directory or file does not exist, `openssl_pkey_new()` returns `false`. When testing signature creation or token minting, this produces unexpected assertion failures:

```text
AssertionError: assert($key !== false)
```

### Diagnosis

Run this quick test in PowerShell:

```powershell
php -r "var_dump(openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]) !== false);"
```

If it prints `bool(false)`, PHP cannot locate a valid OpenSSL configuration file. You can also inspect the compiled default search path:

```powershell
php --ri openssl
```

Look for the line displaying `Openssl default config`.

### Fix

You have two reliable options to resolve this on Windows.

#### Option A: Copy the bundled config to the default path (Recommended)

PHP distributions (including those packaged with Laravel Herd) ship with a valid `openssl.cnf` file inside their extras directory. 

For example, with Laravel Herd, the file is located at:
`C:\Users\<your-username>\.config\herd\bin\php85\extras\ssl\openssl.cnf`

In an elevated PowerShell prompt (Run as Administrator), ensure the destination directory exists and copy the configuration file over:

```powershell
New-Item -ItemType Directory -Force -Path "C:\Program Files\Common Files\SSL"
Copy-Item "$env:USERPROFILE\.config\herd\bin\php85\extras\ssl\openssl.cnf" "C:\Program Files\Common Files\SSL\openssl.cnf"
```

#### Option B: Set the `OPENSSL_CONF` environment variable

If you do not have administrative privileges to write to `Program Files`, register a user-level environment variable pointing directly to your PHP installation's bundled configuration:

```powershell
setx OPENSSL_CONF "$env:USERPROFILE\.config\herd\bin\php85\extras\ssl\openssl.cnf"
```

Close your terminal and open a new window for the environment variable change to take effect.

### Verification

Run the key generation probe again:

```powershell
php -r "var_dump(openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]) !== false);"
```

The output must now print `bool(true)`.

---

## 4. `vendor/` is Incomplete

### The Problem

If a previous `composer install` or `composer update` was interrupted by terminal closure, an anti-virus lock on a temporary folder, or a background process kill, Composer can leave directory stubs without unpacking their files.

Because ParaTest and Pest rely on Amp (`amphp/amp`) and Symfony Process components for process orchestration, an incomplete vendor tree causes Pest to crash before running a single test:

```text
Fatal error: Failed opening required '.../vendor/amphp/amp/src/functions.php' (include_path='.') in ...
```

### Fix

Re-run Composer to verify package integrity and populate missing files:

```powershell
composer install
```

If a custom project plugin or post-install script fails during initial restoration, bypass scripts temporarily to download all missing packages, and then run a clean install:

```powershell
composer install --no-scripts
composer install
```

Inspect the Amp directory to ensure package files are present on disk:

```powershell
Test-Path "vendor/amphp/amp/src/functions.php"
```

This should return `True`.

---

## 5. Feature Tests Need Built Frontend Assets

### The Problem

In modern Laravel applications using Inertia.js (React or Vue) or Vite Blade directives, Feature tests often test HTTP responses that render frontend pages. When an endpoint renders an Inertia view, Laravel's Vite integration checks `public/build/manifest.json` to verify entrypoints.

If you have just cloned the repository, switched branches, or cleared static build directories without rebuilding the client application, Feature tests return HTTP 500 status codes:

```text
Unable to locate file in Vite manifest: resources/js/pages/organization/show.tsx
```

CI workflows always run a build step (such as `npm run build` or `bun run build`) before invoking tests. When testing locally, you must do the same. This is not an application bug or a Vite flaw; it is an expected prerequisite for rendering view components that reference Vite manifests.

### Fix

Run your project's frontend build script:

```powershell
bun run build
```

*(or `npm run build` / `pnpm build` if using Node).*

Verify that the manifest exists:

```powershell
Test-Path "public/build/manifest.json"
```

Once the manifest file is generated, your Inertia and Vite integration tests can locate compiled asset paths without throwing 500 errors.

---

## 6. Measured Results

To illustrate the concrete impact of these fixes, here are actual benchmark results taken on a 20-core Windows 11 workstation running a large enterprise test suite:

- **Feature and Controller Suite (20 Workers)**:
  - *Before Fixes*: Aborted immediately with hundreds of `WIN1252` encoding errors. When forced past encoding issues with pre-created databases, failed halfway through due to `out of shared memory` lock table exhaustion.
  - *After Fixes*: **2,865 tests passed** cleanly in **143 seconds**.
- **Unit and Service Suite**:
  - *Before Fixes*: Failed on cryptographic signature tests with `assert($key !== false)`.
  - *After Fixes*: **838 tests passed** with zero assertion failures.
- **Before the Fixes**:
  - The same parallel run produced hundreds of encoding failures and eventually aborted with out of shared memory errors.

---

## 7. Why This Mostly Bites Windows Users

These problems rarely appear on Linux workstations or in CI environments because:

1. **Linux System Defaults**: Linux distributions and official Docker images configure PostgreSQL with standard `UTF-8` locales out of the box. Windows `initdb` defaults to legacy ANSI code pages based on Windows regional settings.
2. **High-Core Local Workstations**: Windows development machines often feature high-performance desktop or mobile CPUs with 16 to 24 logical cores. Running parallel suites with one worker per core exposes concurrency bottlenecks (such as the default 64-slot Postgres lock table) that never surface on 2-core or 4-core CI runners.
3. **Standalone Extension Stacks**: In Linux environments, OpenSSL system libraries have universally standard filesystem conventions (`/etc/ssl/certs`). Windows has no standard global Unix filesystem root, so compiled native Windows PHP binaries require explicit configuration files.
4. **Tooling Gaps**: CI pipelines run linear workflows that enforce asset compilation and package installation steps prior to test execution. Local development environments allow developers to jump straight into test commands with stale assets or missing build steps.

---

## 8. Caveats and Operating Notes

Keep these operational details in mind when applying these fixes:

- **Back Up Configuration Files**: Always create a backup copy of `postgresql.conf` before editing it.
- **Scope of Database Rebuild**: Rebuilding `template1` alters the blueprint for all future databases created on your local PostgreSQL cluster. It does not alter or re-encode existing development databases (such as your main local app database). If an existing local database was previously created under `WIN1252`, convert it by dumping it, creating a new `UTF8` database, and restoring the data.
- **Stack Updates Can Overwrite Configurations**: If you use an environment manager like Laravel Herd or DBngin, creating a brand new service instance can provision a fresh `postgresql.conf`. Keep this checklist handy so you can re-verify your environment after major stack upgrades.
- **Crash Recovery Patience**: If PostgreSQL is terminated abruptly while workers are actively writing to it, Windows PostgreSQL will perform WAL crash recovery on the next startup. This can take a couple of minutes while it checks data directories. Do not forcefully terminate the process again while recovery is underway.

---

## 9. Quick Verification Reference

Before running your full test suite, verify all five fixes with this sequence of commands:

### 1. Verify PostgreSQL Database Encodings
```sql
select datname, pg_encoding_to_char(encoding) as encoding, datcollate
from pg_database
where datname in ('template1', 'testing');
```
*Expected: Both rows display `UTF8` and `C`.*

### 2. Verify PostgreSQL Lock Capacity
```sql
show max_locks_per_transaction;
```
*Expected: `512`.*

### 3. Verify OpenSSL RSA Key Generation
```powershell
php -r "var_dump(openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]) !== false);"
```
*Expected: `bool(true)`.*

### 4. Verify Frontend Manifest Exists
```powershell
Test-Path "public/build/manifest.json"
```
*Expected: `True`.*

### 5. Verify Vendor Process Files
```powershell
Test-Path "vendor/amphp/amp/src/functions.php"
```
*Expected: `True`.*

---

## 10. Closing

All of these fixes operate at the system and environment level. None of them require altering your application models, changing test logic, or hacking framework internals.

Before blaming your test runner or assuming that parallel testing cannot work smoothly on Windows, check your database template encoding, PostgreSQL lock limits, OpenSSL configuration, and frontend build assets. Once your local environment is configured properly, a 20-core Windows workstation can run large Laravel parallel test suites faster than almost any remote CI server.
