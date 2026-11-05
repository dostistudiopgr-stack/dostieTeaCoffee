# Dosti Tea & Coffee

React, TypeScript, and Vite storefront with customer, admin, and delivery workflows. Business records are stored locally in the browser: structured records in `localStorage`, product image blobs in IndexedDB. This project has no backend or database.

## Run locally

```sh
npm install
npm run dev
npm run build
npm run lint
```

Store identity, contact details, branding, delivery pricing, order minimums, and payment options are configured by an admin in Admin Settings and saved in `dtc_admin_settings`. `.env` is reserved for technical browser configuration such as the optional Google Maps key and app environment. `VITE_` values are embedded in browser code and must never contain secrets.

The first visit to `/admin/login` opens the one-time `/admin/setup` flow when this browser has no saved admin. Customer accounts are created through storefront registration or the Admin Customers page. Delivery accounts are created by an admin. Passwords are stored as salted PBKDF2 hashes in the browser.

## Local data

- Products, categories, orders, customer/admin/delivery accounts, settings, and inventory records use the shared `src/utils/storage.ts` helpers.
- Product images are validated as JPG, PNG, or WebP, limited to 5 MB and stored in IndexedDB. Products may have several images; the first uploaded image is primary.
- The versioned migration first creates an IndexedDB backup of existing local records and uploaded images, then removes audited sample product/category/order records and old demo accounts. Saved user-created records are retained.
- Admin Settings includes backup export, restore, and a confirmed reset. Backups contain account hashes and personal/business records; keep them private.
- The storefront catalog and reports are empty until actual records are entered. Dashboard figures are calculated from saved orders and accounts.

## Maps

The address picker uses Leaflet with OpenStreetMap tiles — no API key required. Tile and geocoding providers are configurable in `src/components/common/MapAddressPicker.tsx`.

## Limits

Browser-local authentication and storage are not security boundaries. Users can inspect and change local data, records do not sync across devices, and browser storage cannot guarantee atomic writes under concurrent activity. Use a trusted backend for production authentication, authorization, payments, durable records, and concurrency-safe inventory.

## Verification

The project currently has build and lint scripts but no automated test framework. No dependencies were installed for tests. A lightweight Vitest setup with React Testing Library is recommended before adding and running component or workflow tests. Browser workflows were not exercised as part of this change.
