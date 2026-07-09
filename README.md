# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG VÀ CÀI ĐẶT HỆ THỐNG KIOSK LẤY SỐ TỰ ĐỘNG
*(BVĐK TỈNH)*

---

## 📑 MỤC LỤC
- [1. Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
- [2. Cấu trúc hệ thống](#2-cấu-trúc-hệ-thống)
- [3. Các chức năng chi tiết](#3-các-chức-năng-chi-tiết)
  - [3.1. Phân hệ Quản trị (Admin)](#31-phân-hệ-quản-trị-admin)
  - [3.2. Phân hệ Kiosk Lấy Số](#32-phân-hệ-kiosk-lấy-số)
  - [3.3. Phân hệ Bàn tiếp đón (Desktop Client)](#33-phân-hệ-bàn-tiếp-đón-desktop-client)
  - [3.4. Phân hệ Tivi & Trạm phát Loa](#34-phân-hệ-tivi--trạm-phát-loa)
- [4. Hướng dẫn Cài đặt chi tiết](#4-hướng-dẫn-cài-đặt-chi-tiết)
  - [4.1. Yêu cầu hệ thống](#41-yêu-cầu-hệ-thống)
  - [4.2. Cài đặt Web Server (Máy chủ trung tâm)](#42-cài-đặt-web-server-máy-chủ-trung-tâm)
  - [4.3. Cài đặt Desktop Client (Máy Bàn tiếp đón)](#43-cài-đặt-desktop-client-máy-bàn-tiếp-đón)

---

## 1. Giới thiệu tổng quan
Hệ thống **Kiosk Lấy Số Tự Động** được thiết kế nhằm tự động hóa quy trình bốc số, gọi loa và theo dõi hàng chờ tại các Khu vực Khám bệnh, Viện phí, v.v.
Hệ thống hoạt động ổn định trên môi trường mạng nội bộ (LAN) của bệnh viện, với tốc độ phản hồi tính bằng mili-giây, hỗ trợ điều hướng âm thanh đa luồng không bị đè tiếng.

---

## 2. Cấu trúc hệ thống
Dự án bao gồm 2 thành phần mã nguồn chính:
1. **`web-server`**: (Next.js + Prisma + PostgreSQL)
   - Đóng vai trò là Máy chủ trung tâm lưu trữ dữ liệu.
   - Cung cấp giao diện Kiosk Lấy số (`/layso/[id]`), giao diện hiển thị Tivi (`/tv/[id]`), giao diện Trạm Audio (`/audio/[id]`) và Trang Quản trị (`/admin`).
2. **`desktop-client`**: (Electron.js)
   - Ứng dụng cài trên máy tính của nhân viên Bàn tiếp đón. 
   - Được thiết kế với chế độ "Luôn Nổi" (Always on Top) đè lên phần mềm HIS.
   - Nhận diện phím tắt toàn cầu (Ví dụ `Alt + 1` để gọi số) kể cả khi phần mềm đang ẩn.

---

## 3. Các chức năng chi tiết

### 3.1. Phân hệ Quản trị (Admin)
- **Truy cập:** `http://<IP_SERVER>:3000/admin`
- **Chức năng:**
  - **Quản lý Khu vực:** Thêm, Sửa, Xóa các khu vực cấp số (Khu Khám Bệnh, Khu Viện Phí...). 
  - **Cấu hình giờ hoạt động:** Giới hạn giờ Sáng / Chiều Kiosk được phép cấp số. Ngoài giờ hệ thống Kiosk sẽ khóa.
  - **Nhảy số Kiosk (Tua nhanh):** Hỗ trợ thiết lập thủ công số thứ tự tiếp theo mà máy Kiosk sẽ nhả ra (rất hữu ích khi máy in lỗi hoặc lỡ mất số).
  - **Quản lý Bàn tiếp đón:** Khai báo các bàn số 1, 2, 3 thuộc từng khu vực. Có thể Kích hoạt hoặc Tạm dừng bàn.
  - **Bảo mật kết nối:** Quản lý khóa thiết bị (Device Lock) để đảm bảo 1 khu vực chỉ có 1 Kiosk và 1 Trạm Audio được kết nối, tránh trùng lặp âm thanh.

### 3.2. Phân hệ Kiosk Lấy Số
- **Truy cập:** `http://<IP_SERVER>:3000/layso/[id_khu_vuc]` (Nên chạy trên Chrome Kiosk Mode hoặc Edge Kiosk Mode).
- **Chức năng:**
  - Chạm màn hình lấy số.
  - Tự động in vé ra máy in nhiệt (K80) với các cấu hình lời chào, lời dặn dò, và số người đang chờ.
  - Khóa màn hình khi hết giờ tiếp đón theo cấu hình Admin.

### 3.3. Phân hệ Bàn tiếp đón (Desktop Client)
- **Sử dụng:** Ứng dụng .exe cài trên máy trạm của nhân viên.
- **Chức năng:**
  - Cấu hình linh hoạt IP Máy chủ và kết nối với ID Bàn tương ứng.
  - **Gọi tiếp theo (Phím tắt: Alt+1):** Gọi số nhỏ nhất đang chờ, và thông báo ra loa tổng.
  - **Gọi lại số (Phím tắt: Alt+2):** Phát lại âm thanh gọi bệnh nhân vào phòng nếu gọi lần 1 không thấy.
  - **Bỏ qua luôn (Phím tắt: Alt+3):** Chuyển số hiện tại sang trạng thái bị Bỏ qua.
  - **Kết thúc / Dừng (Phím tắt: Alt+4):** Tạm dừng bàn tiếp đón hoặc kết thúc khám người hiện tại.
  - **Gọi số chỉ định:** Nút chức năng đặc biệt cho phép nhập số tùy ý (VD: `11`). Hệ thống sẽ gọi đích danh số 11 và tự động dọn dẹp các số nhỏ hơn (từ 1 đến 10) chuyển sang trạng thái "Bỏ qua" để tối ưu luồng gọi số sau đó.

### 3.4. Phân hệ Tivi & Trạm phát Loa
- **Tivi sảnh chờ:** Truy cập `http://<IP_SERVER>:3000/tv/[id]` - Hiển thị 5-10 số gần nhất vừa gọi và tên bàn tương ứng. Giao diện Dark mode sang trọng, chống mỏi mắt.
- **Trạm phát Loa:** Truy cập `http://<IP_SERVER>:3000/audio/[id]` trên 1 máy tính duy nhất có cắm dây ra loa tổng. 
  - Yêu cầu bảo mật: Phải bấm "Kích hoạt" để trình duyệt cấp phép mở âm thanh. 
  - Khi chưa kích hoạt trạm loa, toàn bộ các Bàn tiếp đón sẽ bị hệ thống **chặn lệnh gọi số** (để bảo vệ người bệnh không bị lỡ lượt do hỏng loa).

---

## 4. Hướng dẫn Cài đặt chi tiết

### 4.1. Yêu cầu hệ thống
- Máy chủ (Server):
  - HĐH: Windows 10/11 hoặc Linux.
  - Phần mềm bắt buộc: **Node.js** (v18 trở lên), **PostgreSQL** (v14 trở lên).
  - Git (để tải code).

### 4.2. Cài đặt Web Server (Máy chủ trung tâm)

**Bước 1: Chuẩn bị Cơ sở dữ liệu**
1. Mở PostgreSQL, tạo một database mới tên là `kiosklayso`.
2. Lấy đường dẫn kết nối DB (URL). VD: `postgresql://postgres:password123@localhost:5432/kiosklayso?schema=public`

**Bước 2: Cấu hình mã nguồn**
1. Mở Terminal / CMD tại thư mục `code/web-server`.
2. Tạo file `.env` (hoặc sửa nếu có sẵn) với nội dung:
   ```env
   DATABASE_URL="postgresql://<USER>:<PASS>@localhost:5432/kiosklayso?schema=public"
   ```

**Bước 3: Cài đặt và Khởi tạo**
Chạy tuần tự các lệnh sau:
```bash
npm install
npx prisma generate
npx prisma db push
```

**Bước 4: Chạy Máy chủ**
- **Chạy môi trường Dev (Dành cho thử nghiệm):**
  ```bash
  npm run dev
  ```
- **Chạy môi trường Production (Dành cho triển khai thật):**
  ```bash
  npm run build
  npm start
  ```
Lúc này máy chủ sẽ chạy ở `http://localhost:3000`. Hãy cấp IP tĩnh cho máy chủ (Ví dụ `192.168.1.100`) để các máy con có thể truy cập được thông qua `http://192.168.1.100:3000`.

### 4.3. Cài đặt Desktop Client (Máy Bàn tiếp đón)

Phần mềm Desktop Client cần được biên dịch (Build) ra file chạy `.exe` để cài lên máy các Bác sĩ.

**Bước 1: Cài thư viện**
Mở Terminal / CMD tại thư mục `code/desktop-client`:
```bash
npm install
```

**Bước 2: Chạy thử (Môi trường Dev)**
```bash
npm run dev
```
Phần mềm sẽ hiện ra một cửa sổ nhỏ ghim ở góc.

**Bước 3: Đóng gói ra file .exe (Triển khai)**
```bash
npm run build
```
Đợi quá trình đóng gói hoàn tất. File cài đặt hoặc file chạy trực tiếp sẽ nằm trong thư mục `code/desktop-client/dist` (hoặc `out`). Bạn chỉ cần copy thư mục/file đó sang các máy tính của phòng khám, tạo Shortcut ra màn hình Desktop cho Bác sĩ sử dụng. 

**Khi khởi động lần đầu trên máy Bác sĩ:**
- Mở bảng Cấu hình, nhập IP của máy chủ (VD: `http://192.168.1.100:3000`).
- Chọn khu vực và Bàn (VD: Bàn 1 - Khám Nội).
- Bấm Kết nối.
