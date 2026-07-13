# Hướng dẫn sử dụng & Cài đặt phần mềm Bàn Tiếp Đón Kiosk

## 1. Cấu hình Bàn & Khu vực
Để chống thao tác nhầm lẫn, phần mềm áp dụng tính năng lọc 2 tầng:
- **Bước 1:** Chọn **Khu vực** làm việc (Ví dụ: Lấy số Đăng ký khám).
- **Bước 2:** Hệ thống sẽ tự động tìm và chỉ hiển thị các **Bàn tiếp đón** nằm trong khu vực bạn vừa chọn.
- Phần mềm sẽ tự động ghi nhớ cấu hình này cho những lần mở máy tiếp theo.

## 2. Đổi địa chỉ URL Máy chủ (Mật lệnh dành cho Admin)
Mặc định, ô nhập URL Máy chủ sẽ bị khóa cứng (màu xám) để tránh nhân viên táy máy gõ nhầm làm đứt kết nối hệ thống.
Chỉ có Admin / Tổ IT mới biết cách mở khóa tính năng này:
- **Thao tác:** Đưa chuột vào đúng dòng chữ tiêu đề màu đen **"URL Máy chủ (Kèm port):"**.
- **Mật lệnh:** Click chuột trái **3 lần liên tiếp** thật nhanh vào dòng chữ đó.
- **Kết quả:** Hệ thống báo `🔓 Đã mở khóa cấu hình URL Máy chủ!`, ô nhập liệu lập tức đổi sang màu trắng và cho phép bạn điền tên miền hoặc IP mới. 
- Sau khi nhập xong, nhấn `LƯU CẤU HÌNH` để hoàn tất.

## 3. Hệ thống phím tắt toàn cầu (Global Shortcuts)
Bạn có thể vừa làm việc trên phần mềm khám bệnh (HIS) vừa dùng phím tắt để điều khiển Kiosk mà không cần mở lại cửa sổ phần mềm Kiosk:
- `Alt + 1`: Gọi số tiếp theo
- `Alt + 2`: Gọi lại số hiện tại
- `Alt + 3`: Bỏ qua bệnh nhân hiện tại
- `Alt + 4`: Tạm dừng / Kết thúc phiên tiếp đón
*Lưu ý: Có thể tùy chỉnh đổi phím tắt thoải mái trong màn hình cấu hình nếu bị trùng với phần mềm khác.*

---

## 4. [Dành cho IT] Hướng dẫn Cài đặt Kiosk Tự Đăng Ký (Setup Wizard)
Bắt đầu từ phiên bản mới, phần mềm Desktop Client được tích hợp **Giao diện Cài đặt Trực quan (Setup Wizard)** để phân biệt máy Lấy số và máy Tự đăng ký. IT không cần phải mở hay chỉnh sửa file `config.json` bằng tay.

### Thao tác cài đặt lần đầu (Máy mới):
1. Copy và mở phần mềm Desktop Client trên máy Kiosk.
2. Vì chưa có cấu hình, phần mềm sẽ hiển thị màn hình **Welcome / Setup Wizard** với 2 nút lớn:
   - `[Cấu hình làm máy Lấy Số]`
   - `[Cấu hình làm máy Tự Đăng Ký]`
3. Bấm chọn **"Cấu hình làm máy Tự Đăng Ký"**.
4. Chọn Camera (VD: Logitech) và Đầu đọc (VD: Newland) từ danh sách xổ xuống trên màn hình.
5. Bấm **"Lưu & Khởi động"**. Phần mềm sẽ tự động tạo file config ngầm và chuyển sang màn hình chờ của bệnh nhân. Những lần bật máy sau sẽ vào thẳng màn hình chờ.

### Cách đổi chức năng máy (Ví dụ: Từ máy Lấy số chuyển thành Tự đăng ký):
1. Cắm bàn phím vào máy Kiosk đang chạy.
2. Bấm tổ hợp phím tắt: `Ctrl + Shift + S`.
3. Màn hình Setup Wizard sẽ hiện ra lại. Bạn chỉ cần chọn lại chức năng mong muốn và bấm Lưu.
