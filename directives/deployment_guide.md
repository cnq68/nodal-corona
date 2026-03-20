# Hướng dẫn Triển khai Nodal Corona lên Vercel

Dưới đây là các bước chi tiết để bạn có thể tự mình deploy ứng dụng PKM này lên Vercel hoàn toàn miễn phí.

## 1. Chuẩn bị tài khoản
- Tài khoản **GitHub** (để chứa mã nguồn).
- Tài khoản **Vercel** (liên kết với GitHub).
- Tài khoản **Firebase** (để lưu dữ liệu và Auth).
- Tài khoản **Google Cloud Console** (để dùng AI OCR và STT).

## 2. Thiết lập Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Tạo Project mới tên là `nodal-corona`.
3. Bật **Authentication** -> Method: **Google Auth**.
4. Bật **Firestore Database** (chọn mode production và region gần Việt Nam như `asia-southeast1`).
5. Bật **Cloud Storage** (để lưu ảnh).
6. Vào **Project Settings**, copy các thông số cấu hình (API Key, Auth Domain,...) để dùng ở bước sau.

## 3. Thiết lập Google Cloud (AI)
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn dự án Firebase bạn vừa tạo.
3. Bật các API sau:
   - **Cloud Speech-to-Text API**
   - **Cloud Vision API**
   - **Generative AI API** (cho Gemini)
4. Tạo **Service Account**, cấp quyền `Editor`, sau đó tạo **Key** (dạng file JSON). Copy nội dung file JSON này.
5. Lấy **Gemini API Key** từ [Google AI Studio](https://aistudio.google.com/).

## 4. Đẩy mã nguồn lên GitHub
1. Tải toàn bộ mã nguồn về máy.
2. Khởi tạo git và push lên một repository mới trên GitHub.

## 5. Triển khai lên Vercel
1. Trên Vercel, chọn **Add New Project** -> Import repo từ GitHub.
2. Ở phần **Environment Variables**, điền các biến sau:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `GEMINI_API_KEY`: Key từ AI Studio.
   - `GOOGLE_APPLICATION_CREDENTIALS`: Dán toàn bộ nội dung file JSON của Service Account vào đây.
3. Nhấn **Deploy**.

## 6. Cài đặt PWA
- Sau khi deploy xong, bạn truy cập URL trên điện thoại (iPhone/Android).
- Chọn **Add to Home Screen** để sử dụng như một ứng dụng thực thụ.

---
**Lưu ý:** Đừng quên thay đổi email được phép truy cập trong file `context/AuthContext.tsx` trước khi deploy nếu bạn muốn bảo mật tuyệt đối!
