# HƯỚNG DẪN SỬ DỤNG TÍNH NĂNG LẤY SỐ QUA MÃ QR ĐIỆN THOẠI

Hệ thống KIOSKLAYSO đã được nâng cấp bổ sung tính năng **"Lấy số điện tử qua Mobile"**. Bệnh nhân thay vì phải xếp hàng chạm vào màn hình Kiosk vật lý thì có thể dùng điện thoại cá nhân quét mã QR để lấy số, theo dõi tiến độ khám và lưu ảnh vé.

---

## 1. DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)

### 1.1. Cấu hình hình thức cấp số (Đếm liên tục / Đếm theo ca)
Bệnh viện có thể linh hoạt chọn cách đánh Số Thứ Tự (STT) cho từng Khu vực riêng biệt:

- **Bước 1:** Đăng nhập vào trang Admin > Truy cập menu **Quản lý Khu vực**.
- **Bước 2:** Bấm nút **Thêm Khu vực** (hoặc **Sửa** khu vực hiện tại).
- **Bước 3:** Tại mục **Hình thức đếm số**, chọn 1 trong 2 cấu hình:
  - **Cả ngày (1 -> n):** STT sẽ nhảy liên tục không ngừng từ sáng đến chiều (Reset vào lúc 0h đêm). Thích hợp đếm tổng số lượng khám cả ngày.
  - **Chia ca (Sáng 1->n, Chiều 1->n):** STT của buổi sáng bắt đầu từ 1. Khi đồng hồ chuyển sang "Giờ bắt đầu Ca chiều" (cấu hình ở mục Khung giờ Chiều), STT sẽ **tự động khởi động lại từ Số 1** cho bệnh nhân đầu tiên đến vào buổi chiều.
- **Bước 4:** Bấm **Lưu**.

### 1.2. In Mã QR để dán ngoài sảnh chờ
Quản trị viên có thể in rất nhiều bản sao Mã QR để dán dọc hành lang, cột nhà, phòng bảo vệ... giúp phân luồng bệnh nhân từ xa.

- **Bước 1:** Tại trang Quản lý Khu vực, tìm cột Hành động, bấm vào biểu tượng **Máy in (In Mã QR cho Mobile)**.
- **Bước 2:** Một cửa sổ In sẽ hiện ra. Chú ý dòng **Tên miền / IP máy chủ**:
  - Nếu Bệnh viện phát mạng Wifi nội bộ (Guest Wifi) cho bệnh nhân dùng chung: Hãy điền địa chỉ IP của máy chủ cài Kiosk (Ví dụ: `http://192.168.1.50:3000`).
  - Nếu Bệnh viện đã Public tên miền ra Internet: Điền tên miền public (Ví dụ: `http://htqlbenhvien.bvdklangson.com.vn`).
- **Bước 3:** Sau khi điền, mã QR bên dưới sẽ tự động thay đổi theo. Bấm nút **In trang này** để in ra giấy A4/A5 và mang đi dán.

---

## 2. DÀNH CHO NGƯỜI BỆNH / BỆNH NHÂN

Người bệnh không cần cài đặt thêm bất kỳ ứng dụng nào, chỉ cần có điện thoại kết nối mạng (Wifi/3G).

### Bước 1: Quét mã
Dùng ứng dụng Camera, Zalo hoặc ứng dụng quét mã bất kỳ soi vào **Mã QR dán trên tường** hoặc mã QR nhỏ góc phải trên **Màn hình Kiosk**.

### Bước 2: Nhập số điện thoại để lấy vé
- Trang web "Hệ thống lấy số" sẽ hiện ra.
- Để chống lấy số ảo (spam), hệ thống yêu cầu bệnh nhân **nhập chính xác 10 số điện thoại** của mình. Nút lấy số chỉ sáng lên khi nhập đủ 10 số hợp lệ.
- Bấm **LẤY SỐ NGAY**.

### Bước 3: Xem vé và Lưu ảnh
- Sau khi cấp số thành công, một chiếc **"Phiếu Lấy Số Điện Tử"** sẽ hiển thị to rõ trên màn hình, bao gồm: Khu vực, Số Thứ Tự, Thời gian cấp và Số người đang chờ phía trước.
- **BẮT BUỘC:** Bệnh nhân phải bấm nút **TẢI ẢNH PHIẾU XUỐNG MÁY** màu xanh lá cây. Tờ phiếu sẽ được chụp lại và lưu vào thư viện ảnh của điện thoại. Khi bác sĩ gọi, bệnh nhân mở ảnh này ra để đối chiếu (kể cả khi điện thoại bị mất mạng).

### Bước 4: Theo dõi tiến độ chờ từ xa (Real-time tracking)
- Bệnh nhân có thể đi uống nước hoặc ngồi xa sảnh chờ. 
- Thi thoảng, bệnh nhân mở điện thoại lên, bấm nút **"CẬP NHẬT SỐ NGƯỜI CHỜ"** (Màu xanh dương nhạt).
- Hệ thống sẽ báo chính xác hiện tại dòng người xếp hàng trước mặt mình đã giảm xuống còn bao nhiêu người (Ví dụ: Từ 20 người -> Còn 4 người).

> **Lưu ý: Chống Spam**
> Mỗi số điện thoại chỉ được lấy 1 phiếu đang chờ cho 1 khu vực trong 1 ca khám. Nếu người bệnh thoát trang ra, dùng trình duyệt khác, lấy số điện thoại đó nhập lại thì hệ thống vẫn nhận diện được và trả về chính xác Số thứ tự cũ (không cấp số mới gây kẹt hàng đợi).

---

## 3. LƯU Ý HẠ TẦNG MẠNG CHO IT BỆNH VIỆN
Để tính năng mã QR điện thoại hoạt động được trơn tru nhất:
1. Nếu Máy chủ Kiosk đang dùng IP Nội bộ (Local IP): Cần đảm bảo hệ thống Wifi cấp cho bệnh nhân (Guest Wifi) và hệ thống mạng của Máy chủ Kiosk có thể thông (Ping) được với nhau.
2. Thiết lập IP tĩnh cho Máy chủ Kiosk để tránh trường hợp khởi động lại máy bị nhảy IP, làm các mã QR đã dán trên tường trước đó bị hỏng.
3. **(Khuyến nghị) Truy cập từ Internet qua mạng 3G/4G:** 
   - Hệ thống web-server hiện tại hoàn toàn **HỖ TRỢ TRUY CẬP TỪ INTERNET**.
   - Bệnh nhân dùng mạng 3G/4G cá nhân quét mã QR vẫn có thể lấy số bình thường, giúp giảm tải cho mạng Wifi của bệnh viện.
   - Để làm được điều này, IT bệnh viện cần thực hiện **NAT Port** ra IP Public tĩnh của viện hoặc sử dụng Reverse Proxy (Nginx/Cloudflare) để trỏ Tên miền (Domain) về IP máy chủ Kiosk. Khi cấu hình in QR Code trong trang Admin, hãy nhớ điền Tên miền Public này.
