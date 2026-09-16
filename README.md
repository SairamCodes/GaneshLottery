# Ganapathi Lottery Coupon Booking System

A complete full-stack web application for purchasing and verifying lottery tickets.

## 1. Project Structure
```
ganapathi/
├── backend/            # FastAPI Python backend
│   ├── app/            # Source code (routers, models, schemas, pdf)
│   ├── alembic/        # DB migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic.ini
├── frontend/           # React + Vite + TypeScript frontend
│   ├── src/            # Pages, Components, Services
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docker-compose.yml  # PostgreSQL DB container
├── .env                # Environment variables
└── .env.example
```

## 2. Environment Variables Required
Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` (and `DATABASE_URL_LOCAL` for running without Docker)
- `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRATION_SECONDS`
- `FILE_STORAGE_PATH`, `MAX_UPLOAD_SIZE`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` (Used during initial DB seed)
- `TICKET_TEMPLATE_PATH`

## 3. Database Setup & Migration
1. Ensure Docker is running.
2. From the project root, start the database:
   ```bash
   docker-compose up -d db
   ```
3. Inside the `backend` directory, setup the environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # Or .\venv\Scripts\Activate.ps1 on Windows
   pip install -r requirements.txt
   ```
4. Run migrations to create tables and seed the initial admin account:
   ```bash
   alembic upgrade head
   ```

## 4. How to Run Backend
From the `backend` directory, run:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API will be available at `http://localhost:8000`.

## 5. How to Run Frontend
From the `frontend` directory, run:
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:5173`. (Or the port Vite selects).

## 6. Admin Login Setup
Navigate to `/admin/login`. 
Login with the credentials specified in your `.env` file (`ADMIN_USERNAME` and `ADMIN_PASSWORD`).

## 7. How to Replace Payment QR
1. Log in to the Admin Dashboard.
2. Go to the **Settings** tab.
3. Upload the new QR code image.
4. The system will automatically mark it as active and users will see it immediately.

## 8. How Ticket Numbering Works
When an admin clicks **Verify**, the backend runs a single atomic transaction. It uses a PostgreSQL sequence `ticket_number_seq` to retrieve unique, monotonically increasing numbers (`nextval()`). This guarantees no duplicates even if multiple admins verify different (or the same) orders at the exact same millisecond.

## 9. How PDF Generation Works
The backend uses `WeasyPrint` to convert a Jinja2-rendered HTML template (`app/pdf/template.html`) into a PDF document. The template is based on the original official poster design. One multi-page PDF is generated per order, with each page representing a unique ticket number.

## 10. Security Considerations
- **Passwords**: Hashed with Argon2/Bcrypt via passlib.
- **Tokens**: Stateless JWT implementation for admin.
- **SQL Injection**: Prevented by SQLAlchemy ORM.
- **Concurrency**: PostgreSQL Sequences prevent duplicate ticket numbers.
- **File Uploads**: Restricts mime-types and limits sizes. Uses random UUIDs for filenames to prevent path traversal or direct guessing.
- **Downloads**: Users can only download their PDF if they provide their exact `mobile` number and `order_id` in the API call.

## 11. Testing Instructions
1. Run backend and frontend.
2. Open the user portal and purchase 3 coupons as "Test User".
3. See the expected total of ₹1500.
4. Upload a dummy screenshot and submit the payment.
5. Open the Admin panel, go to Pending Verifications, review the order, and click Verify.
6. Open the user Status page, enter the Order ID and mobile number.
7. Observe that 3 tickets were generated (e.g., #000001, #000002, #000003).
8. Download the PDF and confirm the tickets are properly formatted.
