# Paul's Poke Pulls

V1 foundation: public catalogue + private Supabase-authenticated admin area.

## Local
`npm install`
Copy `.env.example` to `.env.local`, add the Supabase URL and publishable key, then run `npm run dev`.

## GitHub Pages
Add repository Actions secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Enable GitHub Pages with **GitHub Actions** as the source.

Next: proper admin roles, batch processing, scanning/barcodes, Cardmarket pricing, ACE, sales and accounting.
