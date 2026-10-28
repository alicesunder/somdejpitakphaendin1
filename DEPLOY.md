# ขึ้นเว็บจริง (Vercel + Firebase Firestore)

โครงสร้าง: หน้าเว็บ (Vite) + API (`api/[...all].js`, Express เป็น Vercel Function) เก็บข้อมูลทั้งหมดใน Firestore
ผ่านเซิร์ฟเวอร์เท่านั้น — เบราว์เซอร์ไม่คุย Firestore โดยตรง

## 1. Firebase
1. Firebase Console → โปรเจกต์ของคุณ → Build → Firestore Database → Create database (โหมด production)
2. Project settings → Service accounts → Generate new private key → ได้ไฟล์ JSON
3. Firestore → Rules → วางเนื้อหาจาก `firestore.rules` แล้ว Publish (ปิดการเข้าถึงจากเบราว์เซอร์ทั้งหมด)

## 2. Vercel → Settings → Environment Variables (Production)
| ชื่อ | ค่า |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | เนื้อหาไฟล์ JSON ทั้งก้อน |
| `FIREBASE_DATABASE_ID` | เว้นว่างถ้าใช้ฐานข้อมูล (default) |
| `ADMIN_USERNAME` | ชื่อผู้ใช้เข้าหลังบ้าน (ไม่ตั้ง = `adminbpp`) |
| `ADMIN_PASSCODE` | รหัสผ่านยาวๆ เดายาก |
| `ADMIN_TOKEN_SECRET` | สตริงสุ่มยาวๆ |

จากนั้น Redeploy

## 3. โดเมน
Vercel → Settings → Domains → เพิ่ม `www.somdejpitakphaendin.com` แล้วตั้ง DNS ตามที่ Vercel บอก

## 4. ตรวจว่าใช้ได้
- เปิด `https://www.somdejpitakphaendin.com/api/bootstrap` ต้องได้ JSON (ไม่ใช่ 404/503)
- Firestore Console ต้องมี collection `store` (และ `orders` หลังมีใบจองแรก)
- ล็อกอินหลังบ้านด้วย `ADMIN_EMAIL`/`ADMIN_PASSCODE`

## หมายเหตุ
- แก้ `server.ts` หรือ `server/` แล้วต้องรัน `npm run build` และ commit ไฟล์ `api/[...all].js` ที่เปลี่ยนด้วย
- รันในเครื่อง: `npm run dev` (ไม่ตั้ง `FIREBASE_SERVICE_ACCOUNT` จะเก็บเป็นไฟล์ใน `.data/`)
