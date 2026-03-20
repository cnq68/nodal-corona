---
name: note-taking-app
description: Architect, build, and refine premium note-taking suites with Nodal Royale: Minimalist Edition standards. Focuses on 2-column layouts, radical minimalism, and Google Sans typography. Includes advanced features like Workspace management, Fuzzy/Semantic Search, and an Invisible UI Editor.
---

# Tài liệu mô tả hệ thống (SRS) - Web App Note Taking (Minimalist Edition)

Hệ thống tuân thủ triết lý "Nodal Royale: Minimalist Light" - Radical Minimalism, tập trung vào hiệu suất, khoảng trắng và trải nghiệm viết editorial cao cấp.

## 1. Cấu trúc cây thư mục (The Directory Hierarchy)
Hệ thống tuân thủ cấu trúc phân cấp nghiêm ngặt để giữ cho không gian làm việc luôn gọn gàng:
- **Cấp 1: Workspace** (Không gian làm việc riêng biệt: Công việc, Cá nhân, Project A...)
- **Cấp 2: Folder cha** (Thư mục gốc của Workspace)
- **Cấp 3: Folder con** (Sub-folders)
- **Cấp 4: Folder cháu** (Hỗ trợ lồng nhau vô hạn - Nested folders)
- **Cấp 5: Note name** (Tệp tin ghi chú cuối cùng)

## 2. Quản lý Workspace (Workspace Management)
### Thêm Workspace:
- **Trải nghiệm**: Click vào tên Workspace hiện tại ở đỉnh Sidebar để mở menu thả xuống, chọn `+ New Workspace`.
- **Chi tiết**: Mỗi Workspace là một database/sandbox riêng biệt. Cài đặt, tag và thành viên cộng tác sẽ không bị lẫn giữa các Workspace.
### Xóa Workspace:
- **Trải nghiệm**: Nằm sâu trong phần Settings của Workspace để tránh xóa nhầm.
- **Chi tiết**: Khi xóa, hệ thống yêu cầu người dùng gõ lại tên Workspace để xác nhận. Toàn bộ dữ liệu bên trong sẽ bị xóa vĩnh viễn sau 14 ngày lưu sẵn trong bộ nhớ tạm.

## 3. Quản lý Folder & Note (Minimalist Folders)
- **Tạo mới**: Hover vào tên Folder cha sẽ hiện ra dấu `+` nhỏ gọn. Click để tạo nhanh Note hoặc Sub-folder.
- **Xóa Folder**:
  - **Trải nghiệm**: Click chuột phải (Context Menu) hoặc chọn dấu `...` khi hover vào folder.
  - **Chi tiết**: Hệ thống sẽ cảnh báo nếu folder đang chứa folder con hoặc ghi chú. Khi xóa folder cha, toàn bộ con/cháu bên trong sẽ được đưa vào Thùng rác (Trash).
- **Điều hướng (Navigation)**:
  - Sử dụng icon mũi tên (Chevron) để đóng/mở các cấp thư mục.
  - **Trạng thái đóng/mở được lưu lại (Persistent state)**: Đảm bảo khi người dùng reload trang, cây thư mục vẫn giữ nguyên vị trí cũ.

## 4. Hệ thống Tìm kiếm Toàn diện (Search System)
Thanh tìm kiếm thường ẩn để giữ giao diện tối giản, chỉ xuất hiện qua phím tắt hoặc icon nhỏ.
### Lệnh Tìm kiếm Nhanh (Quick Search):
- **Trải nghiệm**: Nhấn `Cmd/Ctrl + K` để gọi thanh Search bar nổi (Modal) ở chính giữa màn hình.
- **Chi tiết**: Sử dụng **Fuzzy Search** (tìm kiếm mờ) giúp đoán ý định người dùng ngay cả khi gõ sai. Kết quả hiện ra ngay lập tức (**Real-time**).
### Thao tác với phím Enter (Search Execution):
- **Kết quả hiển thị**: Nhấn `Enter` để mở kết quả đầu tiên (khớp nhất).
- **Điều hướng phím mũi tên**: Nhấn `Enter` để mở ghi chú đang được highlight.
- **Không có kết quả khớp**: Nhấn `Enter` tự động tạo ghi chú mới với tiêu đề là từ khóa vừa gõ (**Quick Note Creation**).
### Tìm kiếm nâng cao:
- **Scoped Search (`Cmd/Ctrl + F`)**: Chỉ tìm kiếm trong Folder hiện tại và các cấp con của nó. UI hiển thị nhãn `Searching in [Folder Name]`.
- **Bộ lọc Syntax**:
  - `tag:marketing`: Lọc theo tag.
  - `is:pinned`: Tìm các ghi chú đang được ghim.
  - `created:7d`: Tìm ghi chú tạo trong 7 ngày qua.
- **Deep Search & OCR**: Tìm kiếm cả nội dung bên trong file đính kèm (PDF, Hình ảnh).
- **Semantic Search (AI)**: Hiểu ý nghĩa câu hỏi (vd: "kế hoạch du lịch") thay vì chỉ khớp từ khóa, sử dụng Vector Database.

## 5. Cơ chế Gắn thẻ (Tagging System)
Hệ thống thẻ giúp kết nối các thông tin nằm ở các thư mục khác nhau nhưng có chung chủ đề.
### Gắn thẻ Nội dòng (Inline Tagging):
- **Trải nghiệm**: Người dùng gõ ký tự `#` ngay trong trình soạn thảo để bắt đầu gắn thẻ.
- **Chi tiết**: Một menu gợi ý (autocomplete) sẽ hiện ra danh sách các thẻ đã tồn tại. Nếu gõ một từ mới sau dấu `#`, hệ thống sẽ tự động tạo thẻ đó sau khi người dùng nhấn Space hoặc Enter. Các thẻ này sẽ được highlight khác màu với văn bản thường.
### Quản lý Thẻ tại Sidebar (Tag Explorer):
- **Trải nghiệm**: Danh sách các thẻ được gom nhóm lại ở phần dưới cùng của Sidebar, xếp theo thứ tự bảng chữ cái hoặc tần suất sử dụng.
- **Chi tiết**: Khi click vào một thẻ trong danh sách này, hệ thống sẽ thực thi lệnh tìm kiếm `tag:ten_the` để hiển thị toàn bộ ghi chú liên quan.
### Thao tác nhanh trên Thẻ (Global Tag Actions):
- **Trải nghiệm**: Người dùng có thể đổi tên (Rename) hoặc xóa (Delete) thẻ ngay từ danh sách ở Sidebar.
- **Chi tiết**: Khi đổi tên một thẻ, hệ thống sẽ tự động cập nhật lại toàn bộ văn bản chứa thẻ đó trong tất cả các ghi chú để đảm bảo tính nhất quán.

## 6. Trải nghiệm Soạn thảo Tối giản (Minimalist Editor)
- **Invisible UI**: Giao diện trắng hoàn toàn. Thanh công cụ định dạng chỉ xuất hiện khi bôi đen văn bản (**Selection-based toolbar**).
- **Focus Mode**: Sidebar tự động mờ hoặc ẩn khi người dùng bắt đầu soạn thảo.
- **Markdown Native**: Mọi thao tác thực hiện qua cú pháp Markdown hoặc Slash Command (`/`).

## 6. Lưu trữ & Bảo mật
- **Auto-save & Sync**: Mọi thay đổi lưu tức thì, không cần nút Save.
- **End-to-End Encryption (E2EE)**: Mã hóa nội dung ở cấp độ Workspace để đảm bảo quyền riêng tư tuyệt đối.

## 8. Design Tokens (Minimalist Light Royale)
- **Font**: Google Sans (Primary), Outfit (Fallback).
- **Weight Headers**: 600 (Semi-bold).
- **Colors**: Monochromatic Black (#000000) on White (#FFFFFF).
- **UI Elements**: Subtle borders, generous whitespace, high-end editorial feel.

## 9. Trải nghiệm Di động (Mobile UX)
- **Tự động đóng Sidebar**: Khi ở giao diện mobile, nếu Sidebar đang mở và người dùng click vào vùng nội dung hoặc backdrop mờ, Sidebar sẽ tự động đóng lại để tối ưu không gian.
- **Footer Sidebar**: Nút Log Out (Thoát) được đặt ở dưới cùng của Sidebar, cùng hàng với trạng thái Cloud Sync Active, biểu tượng hướng về bên trái để biểu thị hành động quay lại/đăng xuất.

## 10. Tiêu chuẩn Lập trình & Best Practices (Coding Standards)
Để duy trì tính ổn định và khả năng mở rộng của hệ thống:
- **TypeScript Safety**: Luôn bao bọc các hàm xử lý sự kiện (event handlers) trong một hàm nặc danh (anonymous function) nếu hàm đó mong đợi các tham số cụ thể không phải là Event Object (vd: `onClick={() => handleAction(参数)}` thay vì `onClick={handleAction}`). Điều này giúp tránh lỗi mismatch kiểu dữ liệu (Type error) khi build.
- **Data Subscriptions (Firebase)**: Các hàm subscription trong `lib/notes.ts` yêu cầu đầy đủ các tham số lọc để đảm bảo hiệu năng và bảo mật:
    - `subscribeToNotes(userId, workspaceId, callback)`: Bắt buộc phải có `workspaceId`.
    - `subscribeToFolders(userId, workspaceId, callback)`: Bắt buộc phải có `workspaceId`.
    - Tuyệt đối không gọi các hàm này mà thiếu tham số ID không gian làm việc.
- **Minimalist React Components**: Giữ các component nhỏ gọn, tập trung vào một nhiệm vụ duy nhất. Sử dụng `framer-motion` cho các micro-interactions để tạo cảm giác cao cấp.
- **Directory Consistency**: Tuyệt đối tuân thủ cấu trúc thư mục đã đề ra ở Mục 1 để đảm bảo tính nhất quán của hệ thống Workspace.
