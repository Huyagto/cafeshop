# ☕ SorceCafe - Coffee Shop Website

Website bán cà phê với chức năng mua hàng, quản lý sản phẩm, đơn hàng và tài khoản người dùng.

---

# 🛠 Công nghệ sử dụng

### Frontend

* Next.js
* React
* TailwindCSS

### Backend

* Node.js
* Express.js
* Prisma ORM

### Database

* MySQL (WampServer)

---

# 🚀 Hướng dẫn chạy project

## 1️⃣ Cài đặt WampServer

Tải và cài đặt **WampServer** để sử dụng MySQL.

---

## 2️⃣ Cấu hình MySQL

Mở file:

```
wamp64/bin/mysql/mysql*/my.ini
```

Tìm dòng:

```
default_storage_engine=InnoDB
```

Chỉnh sửa:

* Bỏ dấu `;` ở dòng

```
default_storage_engine=InnoDB
```

* Thêm dấu `;` ở dòng

```
default_storage_engine=MYISAM
```

Sau đó:

1. Save file
2. Restart **WampServer**

---

## 3️⃣ Tạo file `.env` cho Backend

Tạo file:

```
backend/.env
```

Nội dung:

```
DATABASE_URL="mysql://root:@localhost:3306/sorcecafe"
```

---

## 4️⃣ Tạo Database bằng Prisma

Mở Terminal trong **Visual Studio Code**

Di chuyển vào thư mục backend:

```
cd backend
```

Chạy lệnh:

```
npx prisma migrate dev --name init
```

Lệnh này sẽ:

* Tạo database `sorcecafe`
* Tạo các bảng từ `schema.prisma`

---

## 5️⃣ Cài đặt Dependencies

### Backend

```
cd backend
npm install
```

### Frontend

```
cd frontend
npm install
```

---

## 6️⃣ Chạy Project

### Chạy Backend

```
cd backend
npm run dev
```

Backend chạy tại:

```
http://localhost:4000
```

---

### Chạy Frontend

```
cd frontend
npm run dev
```

Frontend chạy tại:

```
http://localhost:3000
```

---

# 📂 Cấu trúc Project

```
sorcecafe
│
├── backend
│   ├── prisma
│   ├── src
│   ├── controllers
│   ├── models
│   ├── routes
│   └── server.js
│
├── frontend
│   ├── app
│   ├── components
│   ├── pages
│   └── public
│
└── README.md
