# Hướng dẫn sử dụng Module Quản trị Tự Đăng Ký Khám

Tài liệu này hướng dẫn quản trị viên (Admin) cách sử dụng 3 trang quản lý thuộc tính năng **"Tự Đăng Ký Khám"** trên hệ thống Kiosk Lấy số.

---

## 1. Trang: Quản lý Kiosk Đăng Ký
**Đường dẫn:** `/admin/tu-dang-ky/thiet-bi`

Trang này dùng để khai báo và quản lý danh sách các trạm Kiosk được phép chạy tính năng Đăng ký khám bệnh.

### Hướng dẫn Thêm mới Kiosk
1. Bấm nút **"Thêm Kiosk"** ở góc phải màn hình.
2. Nhập các thông tin cơ bản:
   - **Tên máy Kiosk:** VD: `Kiosk Sảnh A`, `Kiosk Đăng ký số 1`.
   - **Vị trí:** Mô tả vị trí đặt máy để dễ tìm.
3. Khai báo Phần cứng (Rất quan trọng):
   - **Model Máy quét/Đọc thẻ:** Nhập tên thiết bị đọc thẻ đang cắm vào Kiosk này (VD: `Newland FM3080` hoặc `ACR122U`). Dữ liệu này giúp IT biết máy nào đang xài loại đầu đọc nào để chuẩn bị driver tương ứng.
   - **Model Camera:** Nhập loại Webcam (VD: `Logitech HD 1080p`).
4. Phân quyền nghiệp vụ:
   - **Bật/Tắt BHYT:** Nếu gạt tắt, Kiosk này sẽ không hiện luồng khám BHYT.
   - **Bật/Tắt Viện phí:** Tương tự đối với khám dịch vụ/viện phí.
5. Bấm **"Lưu cấu hình"**.

---

## 2. Trang: Cấu hình API HIS
**Đường dẫn:** `/admin/tu-dang-ky/api-mapping`

Đây là trang cấu hình cốt lõi giúp Kiosk giao tiếp được với phần mềm HIS của bệnh viện mà **không cần can thiệp vào mã nguồn (code)**.

### Cách thiết lập kết nối:
1. **URL API Đăng ký khám:** Điền đường dẫn API mà bên HIS cung cấp. VD: `http://10.0.0.5:8080/api/DangKyKham`.
2. **HTTP Method & Headers:** Thường là `POST`. Nếu HIS yêu cầu Token bảo mật, nhập vào ô Headers dưới dạng JSON. (VD: `{"Authorization": "Bearer abc..."}`).
3. **Mapping Dữ Liệu (Khớp trường thông tin):**
   - Bên HIS thường yêu cầu tên biến bằng tiếng Việt không dấu (VD: `MaBHYT`, `HoTen`).
   - Bạn bấm **"Thêm dòng Mapping"**.
   - **Cột trái:** Chọn biến có sẵn của Kiosk (Ví dụ: `cccdNumber`).
   - **Cột phải:** Nhập tên biến mà HIS yêu cầu (Ví dụ: nhập `SoCCCD`).
   - *Kết quả:* Khi bệnh nhân quẹt thẻ, hệ thống sẽ tự lấy số CCCD gắn vào biến `SoCCCD` và gửi sang HIS.

---

## 3. Trang: Test Đầu Đọc CCCD
**Đường dẫn:** `/admin/tu-dang-ky/test-phan-cung`

Trang này được sử dụng riêng cho kỹ thuật viên IT để kiểm tra xem thiết bị phần cứng (như Newland) đang trả về loại dữ liệu gì.

### Quy trình Test chuẩn:
1. Đảm bảo Kiosk (hoặc máy tính đang mở trang này) đã cắm thiết bị quét thẻ qua cổng USB.
2. Click chuột trái vào cái ô màu đen trên màn hình. (Con trỏ chuột phải nhấp nháy trong ô đó).
3. Cầm thẻ CCCD của bệnh nhân đưa vào máy quét Newland (có tiếng bíp).
4. Quan sát kết quả:
   - Nếu màn hình tự động gõ ra chuỗi chứa dấu gạch đứng `|`: Máy đang hoạt động như Bàn phím quét mã QR.
   - Bấm nút **"Copy Dữ Liệu"** và gửi cho đội Dev phân tích.
