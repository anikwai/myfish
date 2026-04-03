# MyFish

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/PHP-8.5-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Inertia-v3-4B0082?style=flat-square&logo=inertia&logoColor=white" alt="Inertia.js">
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Pest-4-C21325?style=flat-square&logo=pestphp&logoColor=white" alt="Pest">
  <img src="https://img.shields.io/github/actions/workflow/status/anikwai/myfish/tests.yml?style=flat-square&logo=github&label=CI&color=4CAF50" alt="CI">
</p>

Fish order fulfillment: customers browse stock, choose by type and size (small / medium / large), set a budget, and customize orders (e.g. filleting, delivery). The app pairs a Laravel backend with an Inertia + React SPA.

## Stack

| Layer | Technology |
| --- | --- |
| Backend | Laravel 13, Fortify (auth), Queues, PostgreSQL |
| Frontend | React 19, Inertia v3, Vite 8, Tailwind CSS v4 |
| UI | [shadcn/ui](https://ui.shadcn.com/) (Radix primitives) |
| DX | Laravel Wayfinder (typed routes), Pint, ESLint, Prettier, TypeScript |
| Authorization | spatie/laravel-permission |

## Requirements

- PHP **8.3+** (developed on **8.5**; CI runs **8.4** and **8.5**)
- [Composer](https://getcomposer.org/) 2
- Node.js **22** (matches CI)
- **PostgreSQL** (local and app DB; automated tests use in-memory **SQLite** via PHPUnit)

## Quick setup

```bash
git clone https://github.com/anikwai/myfish.git
cd myfish
composer run setup
```

`composer run setup` installs dependencies, ensures `.env`, generates the app key, runs migrations, and builds frontend assets.

Before the first migrate, configure PostgreSQL in `.env` (see `.env.example`: `DB_CONNECTION=pgsql` and `DB_*`), create the empty database, and ensure the server is reachable.

**Manual equivalent:** `composer install` → `npm install` → copy `.env.example` to `.env` → `php artisan key:generate` → `php artisan migrate` → `npm run build`.

Set `APP_URL` in `.env` to your local URL (e.g. with [Laravel Herd](https://herd.laravel.com/), often `https://myfish.test`).

## Local development

```bash
composer dev
```

Runs the HTTP server, queue worker, `pail` logs, and Vite in one process (via `concurrently`). Use `npm run dev` alone if the PHP app is already served elsewhere.

After changing routes or controller actions consumed from React, regenerate Wayfinder stubs:

```bash
composer run wayfinder:generate
```

## Testing and code quality

| Command | Purpose |
| --- | --- |
| `composer test` | Pint (check) + application tests |
| `php artisan test --compact` | Tests only (faster iteration) |
| `composer run ci:check` | Full gate: ESLint, Prettier, TypeScript, tests |

Frontend: `npm run lint`, `npm run format`, `npm run types:check`.

## Continuous integration

GitHub Actions run on `develop`, `main`, `master`, and `workos`: [**tests**](.github/workflows/tests.yml) (PHP matrix, `npm run build`, Pest) and [**linter**](.github/workflows/lint.yml) (Pint, ESLint, Prettier).

## Project layout

- `app/` — HTTP, domain, and authentication (Fortify)
- `resources/js/` — Inertia pages and components
- `routes/` — Web routes (`web.php`, `settings.php`)
- `tests/` — Pest feature and unit tests

## Maintainer

[@anikwai](https://github.com/anikwai)

---

**License:** MIT
