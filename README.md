# GitHub Pages Only — Text to Mock Test

This version uses **no Firebase, no backend, no server, and no database**.

## How it works

The teacher pastes MCQs into `index.html`. The browser parses the questions and compresses the test into the URL fragment (`#t=...`). The student opens that URL and the browser reconstructs the test locally.

## Deploy

1. Create a GitHub repository.
2. Upload all files/folders from this project.
3. GitHub → Settings → Pages.
4. Choose Deploy from branch → `main` → `/ (root)`.
5. Open the generated GitHub Pages URL.
6. Create a test and generate its shareable link.

## Question format

Supports:

1. Question text
A) Option A
B) Option B
C) Option C
D) Option D
Answer: A) Option A

It also handles the compact style where the next question number follows directly after the previous Answer.

## Student results

Results are calculated entirely in the student's browser. There is intentionally no online result database. The student can use **Share Result** to send the result through WhatsApp or another sharing app, or use Print / Save.

## Important URL limitation

Because the test is stored inside the link, extremely large tests can produce long URLs. Modern browsers use gzip compression automatically when supported. For normal tests (roughly tens to low hundreds of MCQs), this is generally practical. If you eventually need very large question banks or automatic teacher result collection, a backend/database version is preferable.
