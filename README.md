# Flying Questions

Focused workspace for reviewing and prioritising questions from Flying Thoughts.

The first slice lists only existing thoughts whose knowledge kind is `question`.
It uses the shared Flying Words Django API and SSO account system; questions are not copied into a second database.

## Local development

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npm run dev`.

The app starts at `http://127.0.0.1:5174/`. Its return URL must be present in the backend's `SSO_ALLOWED_FRONTEND_URLS` setting.

## Deployment

`npm run deploy` runs tests, builds the Vite app, and publishes `dist` to the `gh-pages` branch.
In GitHub **Settings → Pages**, choose **Deploy from a branch**, then select `gh-pages` and `/ (root)`.
