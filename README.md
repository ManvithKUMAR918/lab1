# Lab 1: Node.js and Express server

Manvith · YOUR_REGISTRATION_NUMBER · YOUR_SECTION

**Live link:** PASTE_DEPLOYED_URL_HERE

## How to run
```bash
npm install
npm start          # Express server on port 3000
npm run http       # plain http module server (stop the other one first)
```
No environment variables required (optional: `PORT`, default 3000).

## Endpoints
| Method | Path | Description | Status |
| --- | --- | --- | --- |
| GET | `/` | Welcome text | 200 |
| GET | `/about` | JSON with name and section | 200 |
| GET | `/time` | Current date and time | 200 |
| GET | any other path | 404 message | 404 |

## Screenshots
![Home route](screenshots/home.png)
![About route](screenshots/about.png)
![Time route](screenshots/time.png)
![404 route](screenshots/not-found.png)

## Notes
- Placed the 404 handler after all routes, otherwise it would catch everything.
- Add any problems you faced and how you solved them here.
