# 🛒 Order Management API

A **RESTful API** for managing users, products, and orders.  
Built with **Express.js**, **Prisma ORM**, and **PostgreSQL**.  
Interactive API documentation is available via Swagger.

---

## 🚀 Getting Started

### 1. Clone Repository

```sh
git clone <repo-url>
cd <repo-folder>
```

### 2. Install Dependencies

```sh
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory with the following content:

```env
PORT=3000
JWT_TOKEN=supersecret

DATABASE_URL="<insert-psql-connection-string-here>"
```

Make sure to replace the `DATABASE_URL` with your own database connection string if necessary.

### 4. Generate Prisma Client

```sh
npx prisma generate
```

### 5. Sync Database with Prisma

```sh
npx prisma db push
```

### 6. Run Development Server

```sh
pnpm dev
```

The server will be running at:

```
http://localhost:3000
```

---

## 📖 API Documentation

Swagger UI is available at:

👉 [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

You can explore all endpoints and try them out directly (including authentication with JWT tokens).

---

## 🛠 Tech Stack

- [Express.js](https://expressjs.com/) – HTTP server
- [Prisma ORM](https://www.prisma.io/) – Database ORM
- [PostgreSQL](https://www.postgresql.org/) – Relational database
- [Swagger](https://swagger.io/) – API documentation

---

## 📌 Notes

- Ensure your **DATABASE_URL** matches the credentials of your own PostgreSQL instance.
- Whenever you make changes to the Prisma schema, don’t forget to run:

  ```sh
  npx prisma generate
  npx prisma db push
  ```
