# Static Pages — Node.js & Express

A small Express 4 server that serves three static HTML pages, validates a contact form, and returns a custom 404 page for unknown URLs.

## Run locally

1. Install [Node.js](https://nodejs.org/).
2. In this folder, run `npm install`.
3. Run `npm start`.
4. Open [http://localhost:3000](http://localhost:3000).

Set the `PORT` environment variable to use a different port. The contact form validates its fields and demonstrates Post/Redirect/Get; it does not save or email submissions.

## Routes

| Method | Path | Result |
| --- | --- | --- |
| GET | `/` | Home page |
| GET | `/about` | About page |
| GET | `/contact` | Contact form |
| POST | `/contact` | Validates and redirects with HTTP 303 |
| Any | Unknown path | Custom 404 page with HTTP 404 |

The HTML pages and shared stylesheet are in `public/`. Dependencies and local environment files are excluded from GitHub by `.gitignore`.
