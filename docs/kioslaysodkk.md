KẾ HOẠCH & QUY TRÌNH HỆ THỐNG GỌI SỐ TỰ ĐỘNG
(Áp dụng cho Khu vực Tiếp đón - Bệnh viện Đa khoa Tỉnh)
I. SƠ ĐỒ KIẾN TRÚC PHẦN CỨNG & HẠ TẦNG (MẠNG LAN)
Hệ thống được triển khai hoàn toàn trong mạng nội bộ (LAN) của bệnh viện để đảm bảo tốc độ tối đa (<0.1 giây) và hoạt động ổn định 24/7 kể cả khi mất Internet.
	Máy chủ trung tâm (Server phòng CNTT): Lưu trữ Cơ sở dữ liệu (PostgreSQL + Prisma) và chạy mã nguồn chính (Next.js backend). IP tĩnh cố định (Ví dụ: 192.168.1.50).
	Cây Kiosk phát số: Gồm màn hình cảm ứng + Máy in nhiệt K80 kết nối trực tiếp qua cổng USB tại chỗ.
	Các máy tính tại bàn tiếp đón (Số lượng cấu hình động): Máy tính của nhân viên y tế đang chạy phần mềm HIS, cài thêm phần mềm Desktop Mini gọi số.
	Máy chủ âm thanh tại sảnh: Máy tính kết nối trực tiếp với âm ly và hệ thống loa tổng, mở sẵn trang Web nhận lệnh phát loa Real-time.
	Màn hình hiển thị trung tâm: Tivi lớn ở sảnh hiển thị số thứ tự đang được gọi của tất cả các bàn trong khu vực.
II. QUY TRÌNH VẬN HÀNH CHI TIẾT THEO TỪNG LUỒNG
Ca làm việc & Khu vực lấy số (Cấu hình động):
	Cấu hình Khu vực (Area): Hệ thống cho phép khai báo nhiều khu vực lấy số (Ví dụ: Khu Khám Bệnh, Khu Viện Phí). Mỗi khu vực sẽ có một dải số thứ tự bắt đầu từ 1 độc lập với nhau.
	Cấu hình Thời gian (Giao diện Quản trị): Tại trang Admin, khi thêm/sửa Khu vực sẽ có các Nút chọn thời gian (Time Picker) trực quan để Quản trị viên thiết lập khung giờ hoạt động Sáng/Chiều. Ngoài khung giờ này, Kiosk của khu vực đó sẽ tự động khóa (mờ nút lấy số).
	Nửa đêm (00:00): Hệ thống tự động chạy tác vụ ngầm (Cron Job) reset số thứ tự của tất cả khu vực về lại 0.
Luồng 1: Quy trình cấp số (Tại cây Kiosk)
[Người bệnh đến] ──► [Xem trạng thái trên Kiosk]
                          │
         ┌────────────────┴────────────────┐
         ▼ (Trong khung giờ)               ▼ (Ngoài khung giờ)
[Nút "BẤM LẤY SỐ" sáng lên]         [Nút bấm mờ đi - Disabled]
         │                           - Hiện thông báo: "Hết giờ tiếp đón"
         ▼ (Người bệnh bấm nút)      - Chặn hoàn toàn lệnh in.
[Hệ thống xử lý ngầm]
 - Khóa nút bấm ngay (Tránh bấm liên tục).
 - Gọi Server kiểm tra giờ và sinh số tiếp theo. (Lưu ý: Số thứ tự được lưu trực tiếp vào Database để phòng ngừa sự cố. Ví dụ: Nếu đang phát đến số 10 mà mất điện, khi có điện lại Kiosk sẽ tự động truy vấn Database và phát tiếp số 11, tuyệt đối không bị reset lại từ đầu).
 - Đếm số lượng người đang chờ phía trước.
         │
         ▼
[Máy in nhiệt in phiếu ẩn - Chrome Kiosk Mode]
 - Phiếu cắt xoạch tự động, chứa: Số TT (Chữ to), Ngày giờ, Số người đang chờ phía trước. (Lưu ý: Mẫu thiết kế giao diện phiếu in sẽ chốt sau, nhưng cấu trúc HTML/CSS đảm bảo tối ưu cho khổ giấy K80 của máy in nhiệt).
 - Màn hình hiện: "Mời lấy phiếu" và tự động reset sau 3 giây cho người tiếp theo.
	Chức năng bổ sung (In lại phiếu): Tại trang quản trị của nhân viên, nếu máy in bị kẹt giấy hoặc bệnh nhân làm mất phiếu, nhân viên nhập lại số cũ của bệnh nhân đó để máy Kiosk in lại đúng dữ liệu cũ (Tuyệt đối không làm tăng số thứ tự tổng của hệ thống).
Luồng 2: Quy trình gọi số (Tại các Bàn tiếp đón)
Nhân viên tiếp đón sử dụng một Thanh công cụ thu nhỏ (Mini Toolbar) ghim cố định ở góc màn hình. Thanh này được thiết kế Luôn nổi (Always on Top) trên phần mềm HIS và sở hữu Phím tắt toàn cầu (Global Shortcuts) của Windows.
Nhân viên thao tác bằng cách Click chuột hoặc bấm tổ hợp phím Alt + 1, 2, 3 (Phím tắt vẫn có tác dụng ngay cả khi đang gõ chữ nhập liệu bên phần mềm HIS):
🟩 Nút 1: GỌI SỐ (Phím tắt: Alt + 1)
	Bàn đang trống: Bấm nút → Hệ thống tự động bốc số đang chờ (WAITING) nhỏ nhất → Đổi thành trạng thái CALLING → Đèn số bàn trên Tivi sảnh nhấp nháy, loa sảnh phát thông báo.
	Gọi lại (Nhắc nhở): Bệnh nhân chưa vào kịp, bấm lại Alt + 1 lần 2, lần 3 → Hệ thống giữ nguyên số cũ, chỉ kích hoạt loa gọi lại để nhắc nhở.
	Chuyển người: Bệnh nhân trước làm thủ tục xong, bấm Alt + 1 → Hệ thống tự động chuyển số cũ thành COMPLETED (Hoàn thành) → Tự động bốc số chờ tiếp theo lên quầy.
🟥 Nút 2: BỎ QUA (Phím tắt: Alt + 2)
	Áp dụng khi loa gọi 2-3 lần bệnh nhân không có mặt.
	Bấm nút → Số hiện tại chuyển sang trạng thái SKIPPED (Bỏ qua) để lưu vết hệ thống → Giải phóng bàn tiếp đón về trạng thái trống để sẵn sàng gọi số tiếp theo.
🟨 Nút 3: TẠM DỪNG / MỞ LẠI (Phím tắt: Alt + 3)
	Áp dụng khi nhân viên nghỉ trưa, giao ca, hoặc đi họp đột xuất.
	Bấm nút → Trạng thái quầy chuyển sang PAUSED. Khóa tính năng Gọi/Bỏ qua.
	Màn hình Tivi lớn ở sảnh lập tức chuyển dòng trạng thái của bàn này thành: "Tạm dừng phục vụ" để người bệnh nhận biết. Bấm lại nút này để mở quầy hoạt động bình thường.
Luồng 3: Quy trình điều phối Loa phát thanh (Tránh đè tiếng)
Để định danh đúng máy tính phát âm thanh và xử lý tình huống gọi cùng lúc:
	Định danh máy phát loa: Máy tính nào có cắm dây kết nối vật lý (jack 3.5mm) với Âm ly/Loa tổng của bệnh viện thì nhân viên chỉ cần mở một trang Web ẩn dành riêng cho loa (Ví dụ đường dẫn: `http://ip-server/audio-player?areaId=1`). Trang web này sẽ luôn mở và lắng nghe tín hiệu gọi số từ Server qua WebSocket.
	Hàng đợi âm thanh (Audio Queue): Khi các bàn tiếp đón bấm gọi, Server đẩy lệnh về trang `/audio-player` tương ứng. Mã JavaScript trên trang này sẽ xếp các câu lệnh đọc vào một hàng đợi tuần tự.
	Phát loa cuốn chiếu: Trình duyệt Chrome sẽ ghép số và tên bàn vào Mẫu câu đọc được cấu hình sẵn (Ví dụ mẫu: "Mời số {ticket} đến {desk}"), đọc xong nghỉ 1 giây, rồi tự động đọc câu tiếp theo bằng công nghệ Text-to-Speech Offline, đảm bảo không bao giờ bị đè tiếng nhau.

III. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE)
Hệ thống sử dụng PostgreSQL kết hợp với Prisma ORM. Cấu trúc bảng cơ bản như sau:

1. Bảng `Area` (Khu vực):
   - Quản lý danh sách các khu vực lấy số (Ví dụ: Khu Khám Bệnh, Khu Viện Phí).
   - Chứa cấu hình khung giờ lấy số: startTime, endTime, afternoonStartTime, afternoonEndTime.
   - Cấu hình mẫu câu đọc loa (`audioTemplate`): Cho phép tuỳ biến câu gọi (Ví dụ: "Mời bệnh nhân số {ticket} đến {desk}").
   - Các quầy và phiếu chờ sẽ được phân loại theo Khu vực này.

2. Bảng `Desk` (Bàn tiếp đón):
   - Quản lý các quầy tiếp đón (Ví dụ: Bàn 1, Bàn 2).
   - Trường liên kết: `areaId` (Quầy này phục vụ cho Khu vực nào).
   - Trạng thái (DeskStatus): ACTIVE (Đang hoạt động), PAUSED (Tạm dừng).

3. Bảng `Ticket` (Số thứ tự):
   - Quản lý các phiếu chờ của người bệnh.
   - Các trường quan trọng: `ticketNumber` (Số chạy từ 1 theo từng Khu vực), `areaId` (Thuộc khu vực nào), `deskId` (Quầy đang gọi).
   - Trạng thái (TicketStatus): WAITING (Đang chờ), CALLING (Đang gọi), COMPLETED (Đã xong), SKIPPED (Bỏ qua).
   - Các mốc thời gian: `issuedAt` (Giờ lấy số), `calledAt` (Giờ bắt đầu gọi), `completedAt` (Giờ kết thúc/bỏ qua).

IV. CẤU TRÚC DỰ ÁN (Dự kiến)
1. `web-server` (Next.js):
   - Chứa Backend API, giao diện Kiosk (Chrome Kiosk Mode), giao diện Tivi trung tâm, và trang phát âm thanh.
2. `desktop-client` (Electron.js / Tauri):
   - Ứng dụng thu nhỏ cài trên các máy tính tiếp đón. Đảm bảo tính năng Always on Top (luôn nổi) trên phần mềm HIS và nhận Phím tắt toàn cầu (Alt+1, 2, 3) độc lập.
