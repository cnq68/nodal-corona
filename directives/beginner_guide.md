# Hướng dẫn Cài đặt & Triển khai Chi tiết (Dành cho Người mới)

Đừng lo nếu bạn chưa bao giờ làm web! Hãy làm theo từng bước cực kỳ chi tiết sau đây để đưa "Bộ não thứ hai" của bạn lên mạng.

---

## Bước 1: Chuẩn bị Mã nguồn
1. Tải toàn bộ thư mục `nodal-corona` về máy tính của bạn.
2. Nén nó lại thành file `.zip` (hoặc chuẩn bị để đẩy lên GitHub nếu bạn biết dùng Git).

---

## Bước 1.5: Đưa code lên GitHub (Dành cho người mới)

Đây là bước quan trọng để Vercel có thể "đọc" được code của bạn.

### Cách 1: Sử dụng trang web GitHub (Dễ nhất cho 1 lần)
1. Truy cập [GitHub](https://github.com/) và đăng nhập.
2. Nhấn nút **New** (màu xanh) để tạo Repository mới.
3. Đặt tên: `nodal-corona`. Chọn **Public**. Nhấn **Create repository**.
4. Ở trang mới hiện ra, tìm dòng "uploading an existing file". Nhấn vào đó.
5. Kéo toàn bộ các file trong thư mục `nodal-corona` (trừ thư mục `node_modules` và `.next` nếu có) vào trình duyệt.
6. Đợi nó upload xong, kéo xuống dưới nhấn **Commit changes**.

### Cách 2: Sử dụng GitHub Desktop (Chuyên nghiệp hơn)
1. Tải [GitHub Desktop](https://desktop.github.com/) về máy và cài đặt.
2. Mở app, chọn **File** -> **Add Local Repository**.
3. Chọn thư mục `nodal-corona` trên máy bạn. 
4. Nếu nó báo "This directory does not appear to be a Git repository", nhấn link **create a repository** để khởi tạo.
5. Nhấn **Publish repository** để đẩy lên trang web GitHub.

---
1. Truy cập [Firebase Console](https://console.firebase.google.com/). Đăng nhập bằng Gmail.
2. Nhấn **"Add project"**. Đặt tên là `nodal-corona`. Nhấn Continue cho đến khi xong.
3. **Bật Đăng nhập Google**:
   - Ở cột bên trái, chọn **Build** -> **Authentication**.
   - Nhấn **Get Started**.
   - Chọn thẻ **Sign-in method**, nhấn **Add new provider**, chọn **Google**.
   - Nhấn **Enable**, chọn email hỗ trợ của bạn rồi nhấn **Save**.
4. **Bật Cơ sở dữ liệu**:
   - Chọn **Build** -> **Firestore Database**. Nhấn **Create database**.
   - Chọn **Start in production mode**. Nhấn Next.
   - Chọn khu vực (Region): `asia-southeast1` (Singapore - nhanh nhất cho VN). Nhấn **Enable**.
5. **Bật Lưu trữ Ảnh**:
   - Chọn **Build** -> **Storage**. Nhấn **Get Started**.
   - Chọn Next -> Done (không cần đổi gì).
6. **Lấy Thông số Cấu hình**:
   - Nhấn vào biểu tượng bánh răng (Settings) ở góc trên bên trái -> **Project settings**.
   - Ở phần **Your apps**, nhấn vào biểu tượng `< >` (Web icon). Đặt tên là `mynodal`.
   - Nó sẽ hiện ra một đoạn mã. Hãy tìm các dòng có dạng:
     ```javascript
     apiKey: "AIza...",
     authDomain: "nodal-corona-...",
     projectId: "nodal-corona-...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
     ```
     **GIỮ CHÚNG LẠI!** Bạn sẽ cần chúng để điền vào Vercel sau này.

---

## Bước 3: Thiết lập AI (OCR & Voice)
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn đúng dự án `nodal-corona` ở thanh trên cùng.
3. **Bật các "siêu năng lực"**:
   - Gõ lên thanh tìm kiếm: `Cloud Vision API`. Nhấn **Enable**.
   - Gõ: `Cloud Speech-to-Text API`. Nhấn **Enable**.
4. **Tạo Chìa khóa Hệ thống (Service Account)**:
   - Gõ: `IAM & Admin` -> **Service Accounts**.
   - Nhấn **Create Service Account**. Đặt tên bất kỳ (ví dụ: `ai-bot`). Nhấn **Create**.
   - Ở bước 2 (Select a role), chọn **Project** -> **Editor**. Nhấn Done.
   - Nhấn vào email bạn vừa tạo, chọn thẻ **Keys** -> **Add Key** -> **Create new key** -> **JSON**.
   - Một file `.json` sẽ tải về máy. Mở nó bằng Notepad, copy TOÀN BỘ nội dung bên trong.
5. **Lấy Gemini Key**:
   - Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Nhấn **Create API key** -> Chọn dự án `nodal-corona` của bạn.
   - Copy mã key này (bắt đầu bằng `AIza...`).

---

## Bước 4: Triển khai lên Vercel (Đưa lên mạng)
1. Truy cập [Vercel](https://vercel.com/dashboard). Đăng nhập bằng GitHub hoặc Gmail.
2. Nhấn **Add New** -> **Project**. Tải thư mục code của bạn lên (hoặc kết nối GitHub).
3. **CỰC KỲ QUAN TRỌNG: Cài đặt Biến môi trường (Environment Variables)**:
   - Trước khi nhấn Deploy, mở phần **Environment Variables**.
   - Thêm từng cái tên (Key) và giá trị (Value) bạn đã lấy ở Bước 2 và Bước 3:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`: (Value lấy từ Bước 2)
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: (Value lấy từ Bước 2)
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: (Value lấy từ Bước 2)
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: (Value lấy từ Bước 2)
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: (Value lấy từ Bước 2)
     - `NEXT_PUBLIC_FIREBASE_APP_ID`: (Value lấy từ Bước 2)
     - `GEMINI_API_KEY`: (Value lấy từ AI Studio ở Bước 3)
     - `GOOGLE_APPLICATION_CREDENTIALS`: (Dán TOÀN BỘ nội dung file JSON vào đây - Bước 3)
4. Nhấn **Deploy**. Đợi 2 phút, trang web của bạn sẽ sống!

---

## Bước 5: Sử dụng PWA (Cài app vào điện thoại)
1. Mở link trang web Vercel của bạn trên Safari (iPhone) hoặc Chrome (Android).
2. **iPhone**: Nhấn nút "Chia sẻ" (ô vuông có mũi tên) -> Chọn **Add to Home Screen**.
3. **Android**: Nhấn 3 dấu chấm ở góc -> Chọn **Install App** hoặc **Add to Home Screen**.
4. Xong! Bạn đã có một app Nodal Corona xịn xò trên màn hình chính!
