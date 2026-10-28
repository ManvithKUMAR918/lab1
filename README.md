# Lab 1: Node.js and Express server

Manvith · YOUR_REGISTRATION_NUMBER · YOUR_SECTION

**🔗 Live link:** https://lab1-qk3m.onrender.com

---

## 📋 For Evaluators — How to Access the Live App on Render

The app is already deployed and running on Render (free tier). You can evaluate it directly using the live link below — **no setup required**.

### ✅ Live URL:
**https://lab1-qk3m.onrender.com**

### Test the endpoints directly in your browser:

| Route | Full URL | Expected Response |
| --- | --- | --- |
| Home | https://lab1-qk3m.onrender.com/ | `Welcome to my Express server!` |
| About | https://lab1-qk3m.onrender.com/about | JSON with name & section |
| Time | https://lab1-qk3m.onrender.com/time | Current date and time |
| 404 | https://lab1-qk3m.onrender.com/anything | `404 - Route not found` |

> ⏳ **Note:** The free tier spins down after inactivity. If the first request takes ~50 seconds, please wait — the server is waking up. Subsequent requests will be fast.

---

## How to run locally
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
