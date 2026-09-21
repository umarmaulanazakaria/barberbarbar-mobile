# 💈 BARBER BARBAR Mobile

A mobile operational application for **BARBER BARBAR**, built with **React Native, Expo, and TypeScript**.

This project is the mobile implementation of the BARBER BARBAR management system.  
It reuses the existing **BARBER BARBAR REST API backend** from the web project, allowing staff and administrators to manage daily barbershop operations directly from a mobile device.

---

## 📱 Overview

BARBER BARBAR Mobile was developed as the mobile extension of the BARBER BARBAR web and backend system.

The mobile application focuses on daily operational activities such as:

- Authentication
- Dashboard monitoring
- Customer management
- Membership registration
- Creating orders
- Managing service workflow
- Editing order items
- Processing payments
- Viewing user profiles

The mobile application does **not** maintain separate business data.

All important business rules, pricing, discounts, order totals, payment processing, invoices, and persistent data are handled by the same BARBER BARBAR backend used by the web application.

---

## ✨ Features

### 🔐 Authentication

- Login for `ADMIN`
- Login for `STAFF`
- JWT authentication
- Bearer token authentication
- Secure token storage using Expo SecureStore
- Automatic session restoration
- Global expired-session handling
- Logout

---

### 📊 Dashboard

Displays real data retrieved from the backend, including:

- Waiting orders
- Orders currently in service
- Completed unpaid orders
- Paid orders
- Daily revenue
- Customer information
- Active barbers
- Active services
- Latest orders

The dashboard supports refresh and proper loading, error, and empty states.

---

### 👥 Customer Management

- View customer list
- Search customers
- Add new customer
- View customer details
- Customer status support
- Integration with membership data

Customer data is retrieved directly from the BARBER BARBAR backend.

---

### 💳 Membership

Customers can be registered as BARBER BARBAR members.

Membership processing includes:

- Automatic member code generation
- Membership status
- Member discount
- Validation handled by the backend

The mobile application only sends the required request.  
The backend remains responsible for the final membership rules.

---

### 🧾 Order Management

Create a new order by selecting:

- Customer
- Barber
- Service
- Service quantity
- Optional notes

Multiple services can be added to one order.

The backend calculates the authoritative:

- Service price
- Subtotal
- Membership discount
- Final total

---

### 🔄 Order Workflow

BARBER BARBAR uses the following operational workflow:

```text
WAITING
   ↓
IN_SERVICE
   ↓
COMPLETED
```

An order may also be cancelled from supported states:

```text
WAITING ────────→ CANCELLED

IN_SERVICE ─────→ CANCELLED
```

`COMPLETED` and `CANCELLED` are terminal order states.

---

### ✂️ Order Item Management

Before an order is paid, authorized users can:

- Add a service
- Change service quantity
- Remove a service

Available during:

```text
WAITING + UNPAID
IN_SERVICE + UNPAID
COMPLETED + UNPAID
```

Once the order is:

```text
PAID
```

the order items become read-only.

The backend recalculates the order total after every item mutation.

---

### 💰 Payment

Payment is available when:

```text
Order Status   = COMPLETED
Payment Status = UNPAID
```

Supported payment methods:

- CASH
- QRIS
- CARD
- TRANSFER
- OTHER

The backend handles:

- Payment validation
- Payment creation
- Invoice generation
- Amount received
- Change calculation
- Payment status update

After successful payment:

```text
UNPAID
  ↓
PAID
```

---

### 👤 Profile

The Profile screen displays the authenticated user's:

- Name
- Email
- Role

Supported roles:

```text
ADMIN
STAFF
```

Users can also securely log out from the application.

---

## 🛠 Tech Stack

### Mobile

| Technology                     | Usage                             |
| ------------------------------ | --------------------------------- |
| React Native                   | Mobile application framework      |
| Expo SDK 57                    | React Native development platform |
| TypeScript                     | Application language              |
| React Navigation               | Navigation                        |
| Zustand                        | Global authentication state       |
| Axios                          | REST API communication            |
| Expo SecureStore               | Secure JWT storage                |
| React Native Safe Area Context | Safe-area handling                |

### Backend Integration

The mobile application communicates with the existing BARBER BARBAR backend built with:

| Technology | Usage            |
| ---------- | ---------------- |
| Node.js    | Backend runtime  |
| Express    | REST API         |
| TypeScript | Backend language |
| Prisma     | ORM              |
| PostgreSQL | Database         |
| JWT        | Authentication   |

---

## 🏗 Architecture

The application follows this communication flow:

```text
React Native Screen
        ↓
Mobile Service
        ↓
Axios
        ↓
Bearer JWT
        ↓
Express REST API
        ↓
Route
        ↓
Controller
        ↓
Service
        ↓
Prisma
        ↓
PostgreSQL
```

In simple terms:

```text
Screen
=
where the user interacts with the application

Service
=
functions responsible for calling the API

Axios
=
HTTP client used to communicate with the backend

Express Backend
=
handles validation and business rules

Prisma
=
connects the backend to PostgreSQL

PostgreSQL
=
stores the persistent business data
```

---

## 🔗 Relationship With BARBER BARBAR Web

BARBER BARBAR Mobile does not have its own separate backend.

Both applications use the same backend and database:

```text
                  ┌───────────────┐
                  │ PostgreSQL DB │
                  └───────▲───────┘
                          │
                       Prisma
                          │
                  ┌───────┴───────┐
                  │ Express API   │
                  └───────┬───────┘
                          │
                 ┌────────┴────────┐
                 │                 │
                 ▼                 ▼
          BARBER BARBAR       BARBER BARBAR
               Web               Mobile
```

Backend/web repository:

```text
https://github.com/umarmaulanazakaria/barberbarbar
```

---

## 📂 Project Structure

```text
barberbarbar-mobile/
│
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
├── .env
│
├── assets/
│   └── barber-barbar-logo.png
│
└── src/
    │
    ├── komponen/
    │   └── ...
    │
    ├── layanan/
    │   ├── api.ts
    │   ├── barber.ts
    │   ├── dashboard.ts
    │   ├── itemPesanan.ts
    │   ├── layanan.ts
    │   ├── pelanggan.ts
    │   └── pesanan.ts
    │
    ├── layar/
    │   ├── LayarBeranda.tsx
    │   ├── LayarBuatPesanan.tsx
    │   ├── LayarDetailPelanggan.tsx
    │   ├── LayarDetailPesanan.tsx
    │   ├── LayarLogin.tsx
    │   ├── LayarPayment.tsx
    │   ├── LayarPelanggan.tsx
    │   ├── LayarPesanan.tsx
    │   ├── LayarProfil.tsx
    │   └── LayarTambahPelanggan.tsx
    │
    ├── navigasi/
    │   ├── NavigasiPelanggan.tsx
    │   ├── NavigasiPesanan.tsx
    │   ├── NavigasiTabUtama.tsx
    │   └── NavigasiUtama.tsx
    │
    ├── penyimpanan/
    │   └── penyimpananSesi.ts
    │
    ├── store/
    │   └── useSesiStore.ts
    │
    └── tipe/
        ├── autentikasi.ts
        ├── barber.ts
        ├── dashboard.ts
        ├── layanan.ts
        ├── pelanggan.ts
        └── pesanan.ts
```

---

## 🌐 REST API Integration

The central Axios configuration is located at:

```text
src/layanan/api.ts
```

The backend address is configured using:

```env
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_IP:3000
```

Axios uses this value as its base URL.

For example:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

Combined with:

```ts
api.post("/orders", dataPesanan);
```

the request becomes:

```text
POST http://192.168.1.10:3000/orders
```

---

## 🔐 API Authentication

After login, the backend returns a JWT.

The token is stored securely using:

```text
Expo SecureStore
```

For protected API requests, Axios automatically adds:

```http
Authorization: Bearer <JWT_TOKEN>
```

This allows the BARBER BARBAR backend to identify and authorize the authenticated user.

---

## 🔌 Main API Endpoints

### Authentication

```http
POST /auth/login
GET  /auth/me
```

### Customers

```http
GET  /pelanggan
POST /pelanggan
GET  /pelanggan/:id
```

### Membership

```http
POST /memberships
```

### Barbers

```http
GET /barbers
```

### Services

```http
GET /layanan
```

### Orders

```http
GET   /orders
GET   /orders/active
GET   /orders/history
GET   /orders/:id
POST  /orders
PATCH /orders/:id/status
POST  /orders/:id/payment
```

### Order Items

```http
GET    /order-items/order/:orderId
POST   /order-items
PATCH  /order-items/:id
DELETE /order-items/:id
```

### Dashboard

```http
GET /dashboard
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following tools are installed:

- Node.js
- npm
- Git
- Expo Go on an Android/iOS device

The BARBER BARBAR backend must also be running.

---

### 1. Clone the Repository

```bash
git clone https://github.com/umarmaulanazakaria/barberbarbar-mobile.git
```

Enter the project directory:

```bash
cd barberbarbar-mobile
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_IP:3000
```

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

> When using a physical device, do not use `localhost` as the backend address.  
> The mobile device must access the laptop through its local network IP.

Make sure:

```text
Mobile device and laptop
        ↓
connected to the same Wi-Fi
```

---

### 4. Start the Backend

Clone and run the main BARBER BARBAR project:

```text
https://github.com/umarmaulanazakaria/barberbarbar
```

The backend normally runs on:

```text
http://localhost:3000
```

---

### 5. Start the Mobile Application

Run:

```bash
npx expo start
```

Then open the application using:

```text
Expo Go
```

and scan the QR code displayed by Expo.

---

### Clear Expo Cache

If the `.env` configuration changes, restart Expo using:

```bash
npx expo start -c
```

---

## 📡 Local Development Network

When running BARBER BARBAR Mobile on a physical device:

```text
Mobile Device
      │
      │ Wi-Fi
      ▼
Laptop Local IP
      │
      │ :3000
      ▼
BARBER BARBAR Backend
```

Example:

```text
Mobile
↓
192.168.1.10:3000
↓
Express
↓
Prisma
↓
PostgreSQL
```

---

## 🔄 Example — Create Order Flow

When a user creates an order:

```text
LayarBuatPesanan.tsx
        ↓
src/layanan/pesanan.ts
        ↓
src/layanan/api.ts
        ↓
POST /orders
        ↓
Express Backend
        ↓
Order Route
        ↓
Order Controller
        ↓
Validation
        ↓
Order Service
        ↓
Prisma
        ↓
PostgreSQL
```

The mobile application sends the request, while the backend performs the authoritative validation and calculation.

---

## 💰 Example — Payment Flow

```text
LayarPayment
       ↓
POST /orders/:id/payment
       ↓
Backend validation
       ↓
Validate order status
       ↓
Validate payment status
       ↓
Create payment
       ↓
Generate invoice
       ↓
Calculate change
       ↓
Set payment status to PAID
       ↓
PostgreSQL
       ↓
Return result to mobile
```

---

## 🧠 Source of Truth

The backend and PostgreSQL database are the authoritative source for:

- Customers
- Memberships
- Barbers
- Services
- Orders
- Order items
- Prices
- Subtotals
- Discounts
- Final totals
- Order status
- Payment status
- Invoice numbers
- Amount received
- Change
- Order status history

The mobile UI may display temporary calculations for user experience purposes, but final business values are always recalculated and validated by the backend.

---

## ✅ Project Status

```text
CORE FUNCTIONALITY: COMPLETE
STATUS: READY FOR DEMO
```

Implemented and tested:

- ✅ ADMIN login
- ✅ STAFF login
- ✅ JWT authentication
- ✅ Session restore
- ✅ Logout
- ✅ Real dashboard
- ✅ Customer management
- ✅ Membership
- ✅ Create Order
- ✅ Multiple services
- ✅ Quantity management
- ✅ WAITING workflow
- ✅ IN_SERVICE workflow
- ✅ COMPLETED workflow
- ✅ CANCELLED workflow
- ✅ Edit order items
- ✅ Payment
- ✅ Invoice
- ✅ Change calculation
- ✅ PAID state
- ✅ Profile
- ✅ Real REST API integration
- ✅ No primary business dummy data

---

## 🔒 Security Notes

- JWT is stored using Expo SecureStore.
- Protected API requests use Bearer authentication.
- Business rules are validated again by the backend.
- The mobile application does not directly access PostgreSQL.
- Local HTTP is intended only for trusted development environments.
- Production environments should use HTTPS.

---

## 🧭 Development Philosophy

BARBER BARBAR Mobile follows a clear responsibility separation:

```text
Mobile
=
User Interface + API Requests

Backend
=
Validation + Business Logic

Database
=
Persistent Data
```

This prevents important business logic from being duplicated between the web and mobile applications.

---

## 👨‍💻 Author

**Umar Maulana Zakaria**

GitHub:

```text
https://github.com/umarmaulanazakaria
```

---

## 📌 Related Repository

BARBER BARBAR Web & Backend:

```text
https://github.com/umarmaulanazakaria/barberbarbar
```

---

<p align="center">
  <strong>BARBER BARBAR</strong><br/>
  Web + Backend + Mobile Management System
</p>
