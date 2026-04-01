# MyFish

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/PHP-8.4-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Inertia-v3-4B0082?style=flat-square&logo=inertia&logoColor=white" alt="Inertia.js">
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Pest-4-C21325?style=flat-square&logo=pestphp&logoColor=white" alt="Pest">
  <img src="https://img.shields.io/github/actions/workflow/status/anikwai/myfish/tests.yml?style=flat-square&logo=github&label=tests&color=4CAF50" alt="Tests">
</p>

A fish order fulfillment platform where customers browse available stock, select fish by type and size (small, medium, or large), set their budget, and customize orders with options like filleting and delivery.

## Getting Started

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

## Development

```bash
composer dev
```

## Testing

```bash
./vendor/bin/pest
```
