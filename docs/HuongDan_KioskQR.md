# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG VÀ TÍCH HỢP KIOSK QR

Tài liệu này cung cấp hướng dẫn chi tiết về cách thiết lập, cấu hình và sử dụng tính năng **Kiosk Lấy số bằng mã QR**, bao gồm cả cơ chế kết nối với phần mềm bệnh viện (HIS).

---

## 1. Giới thiệu Tính năng
Kiosk QR là một phân hệ chuyên dụng dành cho các khu vực đặc thù (như Quầy Thanh Toán, Phòng X-Quang, Siêu Âm...), nơi bệnh nhân đã có phiếu chỉ định in sẵn mã vạch (Barcode/QR code). 

Thay vì phải bấm nút lấy số vô danh, bệnh nhân chỉ cần đưa phiếu vào máy quét. Hệ thống sẽ tự động đọc mã, gọi dữ liệu từ bệnh viện, in tên bệnh nhân lên phiếu STT, giúp định danh chính xác 100%.

> **Điểm nổi bật:**
> Hệ thống được trang bị thuật toán chống nhiễu (Anti-Ghosting), phân biệt được tốc độ quét siêu nhanh của súng quét QR so với thao tác gõ phím của con người, loại bỏ hoàn toàn các lỗi nhập liệu sai hoặc bị lặp dữ liệu.

---

## 2. Hướng dẫn Cài đặt & Sử dụng cho Quản trị viên (Admin)

### 2.1. Lấy đường link Kiosk QR cho từng phòng
1. Truy cập vào **Trang Quản trị (Admin)**.
2. Mở menu **Danh mục & Khu vực > Quản lý Khu vực**.
3. Tại danh sách các phòng/khu vực (Ví dụ: Khu vực Thanh toán viện phí), nhìn sang cột "Các đường dẫn".
4. Bạn sẽ thấy một đường link có tên là **Kiosk QR** (ví dụ: `/kios/layso-qr/1`).
5. Bấm vào nút **Mở** hoặc **Copy** đường link đó.
6. Mở trình duyệt trên chiếc máy tính Kiosk được đặt tại phòng Thanh toán, dán đường link này vào và bật chế độ Toàn màn hình (F11).
7. Cắm máy quét QR (dạng USB) vào máy tính đó. Vậy là Kiosk đã sẵn sàng phục vụ!

### 2.2. Xử lý lỗi "Truy cập bị từ chối"
Để bảo mật, mỗi khu vực chỉ cho phép MỘT thiết bị Kiosk được mở cùng lúc. 
- Nếu bạn mở link ở máy tính khác, màn hình sẽ báo lỗi **"Truy cập bị từ chối"**.
- **Cách sửa:** Vào trang Quản lý Khu vực (Admin), nhấn vào **Biểu tượng Ổ khóa màu đỏ** ở cột Kiosk QR để Mở khóa thiết bị cũ. Sau đó tải lại (F5) trang ở thiết bị mới.

---

## 3. Hướng dẫn Dành cho Lập trình viên (Tích hợp HIS)

Để Kiosk lấy được "Tên bệnh nhân, Tên dịch vụ" từ mã QR, hệ thống cần được kết nối với API của phần mềm bệnh viện (VNPT HIS, FPT, Viettel...). 

Chúng tôi đã xây dựng sẵn một "Cầu nối" thông minh, bạn không cần phải sửa code giao diện Kiosk, chỉ cần cấu hình theo 2 cách sau:

### Cách 1: Cấu hình nhanh qua Giao diện Quản trị (Khuyên dùng)
Dự án đã có sẵn trang Cấu hình API chuyên nghiệp.
1. Vào mục **Kiosk Tự Đăng Ký > Cấu hình API HIS**.
2. Nhập URL API của bệnh viện vào ô **URL API**. (Ví dụ: `http://10.0.0.5/api/getPatient`).
3. Chọn Method (`POST/GET`).
4. Điền Token bảo mật vào ô **HTTP Headers (JSON)** (VD: `{"Authorization": "Bearer abc1234"}`).
5. Nhấn **Lưu cấu hình**.
6. *Hệ thống sẽ tự động đọc cấu hình này mỗi khi có bệnh nhân quét mã.*

### Cách 2: Tùy biến linh hoạt bằng Code (Advanced)
Nếu API của bệnh viện trả về dữ liệu quá phức tạp (XML, SOAP) mà cấu hình GUI không xử lý được, bạn có thể tự viết hàm xử lý (Parser).
1. Mở file `code/web-server/src/services/hisAdapter.ts`.
2. Tại đây có hàm `lookupPatientByQR(qrData: string)`.
3. Bạn có toàn quyền viết các lệnh `fetch` hoặc `axios` để gọi sang hệ thống HIS theo ý muốn.
4. Cuối cùng, chỉ cần đảm bảo hàm trả về một object theo chuẩn của dự án:
```javascript
return {
  success: true,
  data: {
    name: "Nguyễn Văn A", // Bắt buộc
    phone: "0987654321", // Tùy chọn
    service: "Chụp X-Quang" // Tùy chọn
  }
};
```

---

## 4. Chế độ Test (Dành riêng cho Môi trường Dev)

Trong quá trình phát triển (chạy bằng lệnh `npm run dev`), nếu bạn không có máy quét QR vật lý, hệ thống cung cấp sẵn công cụ giả lập:
1. Mở trang Kiosk QR.
2. Cuộn xuống dưới cùng, bạn sẽ thấy khu vực màu hồng **"Khu Vực Test Cho Developer"**.
3. Tại đây bạn có thể:
   - **Tải lên một bức ảnh mã QR thật** (hệ thống sẽ tự bóc tách ảnh và đọc mã bên trong).
   - Hoặc bấm nút **"Tự động chèn Data mẫu"** để hệ thống giả lập quá trình bệnh nhân quét thành công.

*Lưu ý: Khu vực màu hồng này sẽ tự động biến mất hoàn toàn khi dự án được đóng gói và chạy thực tế (`npm run build` và `npm start`). Do đó, bạn không cần lo lắng bệnh nhân sẽ nhìn thấy nút bấm này.*
