# ExpenseFlow — Expense Tracker

A full-stack personal finance application for recording income and expenses, monitoring monthly budgets, and reviewing spending trends.

## Features

- User registration and login with JWT-based authentication.
- Personal transaction records stored in MySQL.
- Add, edit, view, and delete income and expense transactions.
- Dashboard summaries for total income, expenses, balance, and savings.
- Monthly income-versus-expense chart based on transaction data.
- Expense breakdown by category.
- Transaction search and filters by type and category.
- CSV export of the currently filtered transaction list.
- Monthly category budgets, including spent and remaining amounts.
- Budget warnings when spending reaches 80%, 100%, or exceeds the configured limit.
- Logout functionality.

## Technology stack

- **Frontend:** React, Vite, CSS, Recharts, Lucide React
- **Backend:** Node.js, Express
- **Database:** MySQL
- **Authentication:** JSON Web Tokens (JWT)

## Project structure

```text
Expense Tracker/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── .env                 # Local secrets; do not commit
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── Auth.jsx
    │   ├── Auth.css
    │   └── main.jsx
    ├── index.html
    └── package.json
```

Your project may contain additional files; keep them in place.

## Prerequisites

- Node.js and npm
- MySQL Server (the local Windows service in the development setup is `MySQL80`)
- A MySQL database configured for the application

## Local setup

### 1. Start MySQL

On Windows PowerShell, check the service:

```powershell
Get-Service MySQL80
```

If it is stopped, start PowerShell as Administrator and run:

```powershell
Start-Service MySQL80
```

### 2. Configure the backend

Open a terminal in `backend` and install dependencies:

```powershell
cd "<path-to-project>\backend"
npm install
```

Create or check the local `backend/.env` file. Add the database connection settings and JWT secret required by **your actual `backend/db.js` and `backend/server.js`**. Do not copy real passwords or secrets into this README or commit the `.env` file. Environment-variable names must match the names read by your backend code.

The development setup used a local MySQL database named `expense_tracker`. Make sure the database and its application tables are created before starting the API. Preserve your existing database; do not drop it during setup.

Start the backend:

```powershell
npm run dev
```

The development API is configured to run at:

```text
http://localhost:5000
```

Check the API/database health endpoint in a browser:

```text
http://localhost:5000/api/health
```

### 3. Configure and start the frontend

Open a second terminal in `frontend`:

```powershell
cd "<path-to-project>\frontend"
npm install
npm run dev
```

Vite prints the local frontend URL in the terminal. In the recent development setup it used `http://localhost:5173/`, but use the exact URL shown by Vite if it selects another port.

The frontend currently makes API requests to `http://localhost:5000`. The backend CORS configuration must allow the exact Vite origin displayed in your browser (for example, `http://localhost:5173`).

### 4. Production frontend build

From the `frontend` directory:

```powershell
npm run build
```

Vite writes the production build to `frontend/dist/`.

## API overview

All transaction and budget endpoints below require a valid bearer token in the `Authorization` header, except the health and authentication endpoints.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API/database health |
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Log in and obtain a token |
| GET | `/api/transactions` | List the logged-in user's transactions |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction belonging to the logged-in user |
| DELETE | `/api/transactions/:id` | Delete a transaction belonging to the logged-in user |
| GET | `/api/budgets?month=YYYY-MM` | List the logged-in user's budgets for a month |
| POST | `/api/budgets` | Create or update a category budget for a month |

### Transaction fields

The frontend uses these transaction fields:

- `title`
- `category`
- `amount`
- `type` (`income` or `expense`)
- `transaction_date` (`YYYY-MM-DD`)
- `description` (optional)

### Budget fields

The budget endpoint accepts:

- `category`
- `budget_amount` (must be greater than zero)
- `budget_month` (`YYYY-MM`)

A budget is unique per user, category, and month; submitting the same category and month updates its amount.

## Security and repository hygiene

- Never commit `.env`, database passwords, JWT secrets, access tokens, or real user data.
- Use a strong, private JWT secret in local/deployed configuration.
- Keep authorization checks enabled on transaction and budget routes.
- Do not put demo-account passwords in public documentation or source control.
- Before publishing, inspect the repository for credentials and personal data.

## Manual verification checklist

- [ ] MySQL service is running and the `expense_tracker` database is available.
- [ ] `GET /api/health` confirms the backend/database connection.
- [ ] Registration and login work.
- [ ] A user's transactions are private to that authenticated user.
- [ ] Add, edit, view, and delete transaction operations work.
- [ ] Dashboard totals recalculate after transaction changes.
- [ ] Monthly chart uses actual transaction records.
- [ ] Category expense chart updates from actual expenses.
- [ ] Search and type/category filters work.
- [ ] CSV export downloads the filtered transactions.
- [ ] Monthly budgets can be created and retrieved for different months/categories.
- [ ] Budget warnings behave correctly below 80%, from 80% to under 100%, at 100%, and above 100%.
- [ ] Refreshing the browser does not lose persisted transactions or budgets.
- [ ] Frontend production build completes with `npm run build`.
- [ ] Backend syntax check passes with `node --check server.js`.
- [ ] `.env` and all secrets are excluded from version control.

## Notes

This README describes the local development setup and features implemented during development. Before deployment, configure production database credentials, a production JWT secret, HTTPS, production CORS origins, and a suitable hosting environment. Do not expose a local development server as a production deployment.
