# АндСофт Backend - InfinityFree Deployment Guide

## Тойм

PHP/MySQL backend систем. InfinityFree (эсвэл бусад PHP хостинг) дээр ажиллахаар зориулагдсан.

**Технологи**: PHP 7+, MySQL 5.7+, PDO, Sessions

## Суулгах заавар

### 1. InfinityFree дээр бүртгэл үүсгэх

1. [infinityfree.com](https://infinityfree.com) дээр бүртгүүлнэ
2. Шинэ хостинг бүртгэл (hosting account) үүсгэнэ
3. Domain эсвэл subdomain сонгоно

### 2. MySQL өгөгдлийн сан үүсгэх

1. InfinityFree Control Panel → **MySQL Databases**
2. Шинэ database үүсгэнэ
3. Дараах мэдээллийг тэмдэглэж аваарай:
   - **Database host**: `sql306.infinityfree.com` (эсвэл өгсөн хост)
   - **Database name**: `if0_xxxxxxx_andsoft` (эсвэл таны нэр)
   - **Database user**: таны хэрэглэгчийн нэр
   - **Database password**: таны нууц үг

### 3. Файлуудыг upload хийх

InfinityFree File Manager эсвэл FTP ашиглан бүх файлуудыг upload хийнэ:

```
htdocs/
├── index.html
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
├── admin/
│   ├── index.html
│   ├── install.html
│   ├── admin.js
│   ├── backend-bridge.js
│   └── style.css
└── backend/
    ├── api.php
    ├── config.php      ← ЭНД ТОХИРГОО ЗАСНА
    ├── db.php
    ├── helpers.php
    ├── database.sql
    ├── .htaccess
    └── api/
        ├── auth.php
        ├── users.php
        ├── profile.php
        ├── settings.php
        ├── content.php
        ├── crud.php
        ├── pricing.php
        ├── advantages.php
        ├── messages.php
        ├── orders.php
        ├── notifs.php
        ├── activity.php
        ├── dashboard.php
        ├── public_data.php
        └── install.php
```

### 4. Тохиргоо засах

`backend/config.php` файлыг засна:

```php
define('DB_HOST', 'sql306.infinityfree.com');  // Таны DB host
define('DB_NAME', 'if0_xxxxxxx_andsoft');      // Таны DB нэр
define('DB_USER', 'if0_xxxxxxx');              // Таны DB хэрэглэгч
define('DB_PASS', 'yourpassword');             // Таны DB нууц үг
```

### 5. Install wizard ажиллуулах

Хөтчөөрөө `https://yourdomain.com/admin/install.html` руу орно:

1. "Суулгах" товчийг дарна
2. Database хүснэгтүүд автоматаар үүснэ
3. Анхны админ хэрэглэгч үүснэ

### 6. Нэвтрэх

`https://yourdomain.com/admin/` руу орно:

- **Нэвтрэх нэр**: `admin`
- **Нууц үг**: `andsoft123`

> Нэвтэрсний дараа профайлаас нууц үгээ солиорой!

## Архитектур

### API Endpoint-ууд

Бүх API дуудлага: `backend/api.php?action=xxx`

| Action | Тайлбар |
|--------|---------|
| `login` | Нэвтрэх |
| `logout` | Гарах |
| `session` | Session шалгах |
| `services.list/save/delete` | Үйлчилгээ CRUD |
| `team.list/save/delete` | Хамт олон CRUD |
| `partners.list/save/delete` | Хамтрагч CRUD |
| `packages.list/save/delete` | Багц CRUD |
| `projects.list/save/delete` | Төсөл CRUD |
| `pricing.list/saveCat/deleteCat/saveItem/deleteItem` | Үнэ CRUD |
| `advantages.list/saveSec/deleteSec/saveItem/deleteItem` | Давуу тал CRUD |
| `sidebar.get/save` | Sidebar тохиргоо |
| `about.get/save` | Танилцуулга |
| `contact.get/save` | Холбоо барих |
| `messages.list/delete/submit` | Мессеж |
| `orders.list/delete/submit` | Захиалга |
| `notifs.list/markRead/count` | Мэдэгдэл |
| `activity.list` | Лог |
| `dashboard.stats/recent` | Dashboard |
| `public.all` | Нийтийн мэдээлэл (auth шаардахгүй) |
| `install` | DB суулгах |

### Ажиллагааны зарчим

- **Offline/Fallback**: Backend ажиллахгүй бол localStorage-с ажиллана
- **Sync**: Нэвтэрсний дараа backend-с мэдээлэл localStorage руу татна
- **Push**: localStorage-д хадгалах бүрт backend руу мөн илгээнэ
- **Sessions**: PHP session ашиглана (cookie-based)
- **Passwords**: `password_hash()` / `password_verify()` (bcrypt)

## Аюулгүй байдал

- CORS тохиргоо `config.php` дээр
- `.htaccess` нь config файлуудруу шууд хандахыг хориглоно
- PDO prepared statements ашигладаг (SQL injection хамгаалалт)
- Password bcrypt-ээр hash-лагдсан
- Эхний админ (id=1) устгагдах, блоклогдохоос хамгаалагдсан
