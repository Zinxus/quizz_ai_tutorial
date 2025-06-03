Cài đặt Vscode nếu chưa cài:
Truy cập https://code.visualstudio.com/

 

Chọn phiên bản và tải xuống.
Nhấn mở và cài đặt.
Sau khi cài đặt Vscode, cài đặt gói ngôn ngữ cần thiết node.js:
Truy cập link: https://nodejs.org/en/download

 

Sau khi đã tải về mở và cài đặt node.js.

 

Mở terminal chạy lênh sau để đảm bảo node.js đã được cài đặt:
 
Mở Vscode open folder chứa code.
Mở terminal, cd tới folder: cd /folder
Chạy lệnh sau để import các thư viện cần tiết có trong package.json:
npm install
Chạy lệnh sau để fix các thư viện bị lỗi
npm audit fix
hoặc
npm audit fix –force
Để chạy code trước tiên chạy lệnh 
npm run build 
sau đó chạy 
npm run dev
Mở trình duyệt web.
Tìm kiếm:
http://localhost:3000/


## Công Nghệ Sử Dụng

- Next-auth - Authentication
- Shadcn ui - ui library
- Open Al - AI Integration
- Langchain - LLM Framework
- Drizzle - Orm
- PostgreSQL - Database
- Supabase - Database hosting
- Stripe - Payments
- Tanstack - Table
- Typescript - Type Checking
- Stripe - Payments
- Zod - Schema Validation

Đầu Tiên

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```



Kiểm tra file .evn đã có chưa:
```
OPENAI_API_KEY=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
AUTH_SECRET=""
DATABASE_URL=""
NEXT_PUBLIC_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_WEBHOOK_LOCAL_SERCRET=""
```
