# HƯỚNG DẪN CÁC TÍNH NĂNG MỚI (Cập nhật Sáng nay)

Tài liệu này tổng hợp lại toàn bộ các phần việc và tính năng mới đã được phát triển và tích hợp vào hệ thống Kiosk Lấy Số trong phiên làm việc sáng nay.

---

## 1. Tính năng: Giới hạn số lượng phiếu (Issue Limit)
**Mục đích:** Khống chế số lượng bệnh nhân tối đa có thể lấy số tại một khu vực trong một khoảng thời gian nhất định (Ca sáng / Ca chiều / Cả ngày).

**Cách sử dụng:**
- Đăng nhập vào trang **Quản trị Kiosk** -> **Quản lý Khu vực**.
- Bấm **Thêm mới** hoặc **Sửa** khu vực.
- Tích chọn hộp kiểm: **"Giới hạn số lượng phiếu được cấp"**.
- Điền số lượng mong muốn vào các ô (Ca sáng, Ca chiều). 
- **Lưu ý đặc biệt:** Nếu bạn muốn một ca nào đó lấy phiếu thoải mái không giới hạn (Ví dụ: Sáng giới hạn 10 số, Chiều không giới hạn), hãy **nhập số `0`**. Số 0 được hệ thống tự động hiểu là "Vô hạn".
- Khi Kiosk phát hết số lượng quy định, màn hình Kiosk của khu vực đó sẽ báo lỗi không cho người bệnh lấy số tiếp.

---

## 2. Tính năng: Sinh và In phiếu hàng loạt
**Mục đích:** Hỗ trợ nhân viên y tế (như ở quầy Viện phí) in sẵn một cuộn dài nhiều số thứ tự (Ví dụ: in sẵn 50 phiếu) để phát tay cho nhanh.

**Có 2 cách thực hiện:**
- **Cách 1 (Từ Trang Quản trị Admin):** 
  - Vào **Quản lý Khu vực**. Ở cột *Hành động* của bảng, bấm vào biểu tượng **Máy in (Màu xanh lá)**.
  - Nhập số lượng cần in (VD: 50) và xác nhận. Hệ thống sẽ tự động bật ra một tab in mới chuẩn khổ K80 để in.
- **Cách 2 (Từ trực tiếp Màn hình Kiosk công cộng):** 
  - Tại giao diện Kiosk lấy số (Màn hình mà bệnh nhân đang xem), **nhấn vào góc dưới cùng bên trái** (chỗ này được làm ẩn đi để tránh bệnh nhân bấm nhầm).
  - Một hộp thoại hiện ra sẽ yêu cầu nhập **Mã PIN**.
  - Nhập đúng Mã PIN và số lượng phiếu, Kiosk sẽ tự động xả giấy in ra hàng loạt.

---

## 3. Tính năng: Mã PIN bảo mật Kiosk (Kiosk PIN)
**Mục đích:** Ngăn bệnh nhân và người không phận sự truy cập vào các tính năng "chìm" của nhân viên (như In hàng loạt ở trên) ngay tại màn hình Kiosk.

**Cách sử dụng:**
- Thay vì dùng chung 1 pass cho toàn viện, mỗi Khu vực giờ đây có một Mã PIN riêng biệt.
- Vào Form **Sửa/Thêm Khu vực**, bạn sẽ thấy ô **"Mã PIN Kiosk"** (Mặc định là `123456`).
- Admin có thể tự do đổi pass này. Khi nhân viên thao tác trên màn hình Kiosk của khu vực đó, họ phải nhập đúng số PIN này thì lệnh in hàng loạt mới được thực thi.

---

## 4. Danh mục: Quản lý Nhóm / Cơ sở
**Mục đích:** Giúp phân loại các Khu vực (Areas) vào từng Cơ sở/Tòa nhà/Nhóm quản lý cụ thể (Ví dụ: Cơ sở 1, Bệnh viện Đa khoa Tỉnh, Khu nhà A...) một cách quy chuẩn.

**Cách sử dụng:**
- **Khai báo danh mục:** Ở thanh Menu bên trái (Sidebar) của trang Admin, có thêm mục mới là **"Danh mục Nhóm / Cơ sở"**. Quản trị viên bắt buộc phải vào đây để thêm tên các Cơ sở trước.
- **Gắn nhóm cho Khu vực:** Trong Form **Sửa/Thêm Khu vực**, ô Nhóm/Cơ sở đã được thiết kế thành một Danh sách thả xuống (Dropdown). Nhân viên chỉ được phép chọn các cơ sở đã được khai báo ở bước trên.
- Trong bảng Quản lý Khu vực, bạn có thể lọc (Filter) để chỉ xem các phòng khám thuộc "Cơ sở 1" rất dễ dàng.

---

## 5. Tối ưu hóa Giao diện (UI/UX)
- Form Cấu hình Khu vực đã được mở rộng không gian lên **1000px** và chia thành **2 cột** rõ ràng:
  - **Cột trái:** Cấu hình thông số logic (Tên, Giờ giấc, Nhóm, Giới hạn, Mã PIN).
  - **Cột phải:** Cấu hình hiển thị (Mẫu câu đọc loa, Tên in trên vé, Lời chào, Lời dặn dò).
- Layout 2 cột giúp Admin không phải cuộn chuột quá dài, thao tác tập trung và trực quan hơn rất nhiều.
