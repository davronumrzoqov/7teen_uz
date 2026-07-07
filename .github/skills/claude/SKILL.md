---
name: claude
description: 'Use when working on the 7seventeen Coffee project: inspect the app, update the frontend or backend, and verify behavior locally before finishing.'
argument-hint: 'What should be changed in the coffee app?'
---

# Claude Workflow for the Coffee App

## When to Use
- You need to understand or modify the coffee shop website.
- You are changing the frontend, backend API, admin panel, or menu data.
- You need to verify the app locally before reporting completion.

## Goal
Help the agent make small, reliable improvements to this Node/Express + static-site project while keeping the app functional.

## Procedure
1. Inspect the project structure.
   - Review [package.json](../../package.json), [README.md](../../README.md), and [server.js](../../server.js).
   - Note whether the request affects the public site, admin panel, API routes, or data files.

2. Understand the relevant part of the app.
   - Frontend files: [index.html](../../index.html), [app.js](../../app.js), [main.css](../../main.css)
   - Admin files: [admin.html](../../admin.html), [admin.js](../../admin.js), [admin.css](../../admin.css)
   - Menu data: [data/menu.js](../../data/menu.js)
   - Backend API: [server.js](../../server.js)

3. Make the smallest change that solves the request.
   - Prefer focused edits over broad rewrites.
   - Keep existing naming patterns and file structure intact.
   - Preserve the app’s current behavior unless the request requires a change.

4. Verify the result locally.
   - Install dependencies if needed: `npm install`
   - Start the server: `npm start`
   - Check the affected route or feature manually.
   - If the change touches API behavior, verify the relevant endpoint with a request or browser flow.

5. Report clearly.
   - Summarize what changed.
   - Mention how it was verified.
   - Call out any remaining limitations or follow-up work.

## Completion Checklist
- The relevant files were inspected before editing.
- The change matches the user request and project conventions.
- The app still runs locally.
- Verification evidence is included in the final response.

## Notes
- This project is a simple Express server serving static files and JSON APIs.
- The admin panel uses the default password `admin123` unless `ADMIN_PASSWORD` is set in the environment.
- The frontend reads its API base from [config.js](../../config.js) when needed.
