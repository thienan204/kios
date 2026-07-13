# Kế hoạch phát triển chức năng: Tự đăng ký khám trên Kiosk

## 1. Mục tiêu
- Cho phép người bệnh khi đến bệnh viện có thể **tự đăng ký khám bệnh** trực tiếp trên máy Kiosk mà không cần thông qua quầy tiếp đón.
- Đối với bệnh nhân sử dụng Bảo hiểm Y tế (BHYT): Yêu cầu bệnh nhân chèn thẻ Căn cước công dân (CCCD) có gắn chip và thực hiện xác thực khuôn mặt (Face Matching) để đảm bảo chính chủ.

> [!IMPORTANT]
> **Phạm vi hệ thống:** Module "Tự đăng ký khám" này hoạt động **tách biệt hoàn toàn** với luồng "Lấy số thứ tự" (Queue Management) hiện tại. Đây là một quy trình độc lập phục vụ riêng cho nghiệp vụ đăng ký trực tiếp và đẩy dữ liệu vào HIS.

## 2. Yêu cầu nghiệp vụ dự kiến (Draft)
- **Bước 1 (Chọn đối tượng):** Khách hàng chọn loại hình khám (Khám BHYT hoặc Khám Dịch vụ).
- **Bước 2 (Xác thực - dành cho BHYT):** Hệ thống yêu cầu đưa CCCD vào đầu đọc và nhìn vào camera. Kiosk sẽ đọc thông tin chip, quét khuôn mặt và đối chiếu (match).
- **Bước 3 (Kiểm tra BHYT):** Kiosk tự động gọi API lên cổng BHYT hoặc HIS để kiểm tra tuyến, tình trạng thẻ BHYT.
- **Bước 4 (Chọn dịch vụ/phòng khám):** Hiển thị danh sách các phòng khám/khoa để bệnh nhân tự chọn dựa trên triệu chứng hoặc theo chỉ định.
- **Bước 5 (Hoàn tất & In phiếu):** Kiosk in phiếu đăng ký khám (chứa thông tin bệnh nhân, số thứ tự, phòng khám) và đẩy dữ liệu vào phần mềm HIS của bệnh viện.

## 3. Phân tích kỹ thuật (Technical Design - Dự kiến)
Vì ứng dụng chính của chúng ta là Web (Next.js), nên trình duyệt web không thể giao tiếp trực tiếp với đầu đọc CCCD (phần cứng qua cổng USB). Do đó, chúng ta sẽ tận dụng ứng dụng **Desktop Client (Electron)** hiện có của hệ thống để làm "cầu nối".
- **Desktop Client (Electron) - Tự động nhận diện (Plug & Play):** Phần mềm nền sẽ được thiết kế theo chuẩn Zero-touch. Khi bật máy, nó tự động quét các cổng USB. Nếu phát hiện Camera Logitech hoặc Đầu đọc Newland, nó sẽ tự động kết nối và đồng bộ thông tin phần cứng này lên thẳng Server Admin (IT không cần cấu hình bằng tay). Nó dùng SDK/PC/SC để trích xuất ảnh và dữ liệu từ chip truyền lên Web.
- **Xác thực khuôn mặt Local (Face Matching):** Chúng ta sẽ sử dụng thư viện AI cục bộ (như `face-api.js`) chạy trực tiếp trên Kiosk để so khớp ảnh trích xuất từ chip CCCD với ảnh chụp từ Camera hiện tại. Ưu điểm: Không tốn phí bên thứ 3, hoạt động hoàn toàn nội bộ và rất nhanh.
- **Web App (Next.js):** Giao diện Kiosk sẽ kết nối với Desktop Client (qua WebSocket hoặc Local API) để nhận dữ liệu CCCD và kết quả đối chiếu khuôn mặt.

## 4. Các vấn đề cần làm rõ (Open Questions)
> [!IMPORTANT]
> Vì Bệnh viện đã có sẵn Kiosk tích hợp đầu đọc nhưng phần mềm cũ không đáp ứng được, chúng ta sẽ tự xây dựng module đọc thẻ mới. Cần làm rõ:
> 
> 1. **Camera quét khuôn mặt:** Đã xác nhận sử dụng Webcam Logitech HD 1080p (Logi). Đây là Webcam USB chuẩn, có thể truy cập trực tiếp từ trình duyệt Web (Next.js) qua API `navigator.mediaDevices.getUserMedia` mà không cần cài thêm SDK phức tạp.
> 2. **Thiết bị Đầu đọc CCCD (Newland):** Đã xác nhận hệ thống cũ có thể Face Matching thành công khi đưa thẻ vào thiết bị Newland này. Điều này chứng tỏ máy có tích hợp tính năng đọc chip NFC (hoặc có khả năng chụp quét mặt thẻ OCR) để lấy được ảnh gốc. **Nhiệm vụ kỹ thuật:** Chúng ta sẽ cần tìm Driver/SDK của hãng Newland (hoặc dùng giao thức chuẩn PC/SC) để tích hợp vào phần mềm Desktop Client (Electron), từ đó gọi lệnh đọc dữ liệu và trích xuất ảnh truyền lên giao diện Web.
> 3. **Tích hợp HIS:** (Chờ thông tin). Cần API của phần mềm HIS hiện tại để Kiosk gọi lệnh "Đăng ký khám" hoặc "Tra cứu BHYT".

## 5. Các Module Quản trị (Admin) bổ sung
Để hệ thống linh hoạt và dễ bảo trì, chúng ta sẽ ưu tiên phát triển 2 trang quản trị này trước khi code ứng dụng Kiosk thực tế:

### 5.1. Trang Quản lý thiết bị kết nối (Device Management)
- **Mục đích:** Quản lý tập trung trạng thái và thiết bị ngoại vi của tất cả máy Kiosk.
- **Tính năng dự kiến:**
  - **Danh sách Kiosk:** Quản lý thông tin máy (Địa chỉ IP, Tên máy, Vị trí đặt, Trạng thái online/offline).
  - **Quản lý thiết bị ngoại vi:** Theo dõi/cấu hình các đầu đọc CCCD, Camera, Máy in gắn với từng Kiosk.
  - **Phân luồng nghiệp vụ:** Có thể cài đặt cấu hình riêng (Ví dụ: Cấu hình Kiosk A chỉ nhận khám BHYT, Kiosk B nhận Dịch vụ).

### 5.2. Trang Quản lý Cấu hình Mapping API HIS (HIS API Field Mapping)
- **Mục đích:** Động hóa quá trình kết nối với HIS, không "hardcode" để tránh rủi ro khi phần mềm HIS thay đổi API.
- **Tính năng dự kiến:**
  - **Quản lý Endpoint:** Khai báo URL API của HIS, HTTP Method (GET/POST), và các thông số Headers (như Authorization, Token).
  - **Mapping dữ liệu (Field Mapping):** Giao diện thiết lập để "khớp" (map) thông tin hệ thống của chúng ta (VD: `cccdNumber`, `patientName`) sang cấu trúc field mà API của HIS yêu cầu (VD: `MaBHYT`, `HoTen`).
  - **Công cụ Test trực tiếp:** Cho phép nhập dữ liệu và gửi thử Request lên HIS ngay tại trang quản trị để kiểm tra kết quả Mapping trước khi áp dụng cho Kiosk.

## 6. Quyết định Kiến trúc & Cấu trúc Thư mục (Architecture)
Theo thống nhất, Module "Tự đăng ký khám" sẽ được tích hợp vào dự án `web-server` hiện tại nhưng tuân thủ nguyên tắc **Tách biệt Route và Bảng CSDL**:

- **Cấu trúc thư mục (Routes):**
  - Giao diện cho Kiosk: Đặt tại `src/app/tu-dang-ky/...` (hoạt động độc lập hoàn toàn với `src/app/kiosk/...`).
  - Giao diện cho Quản trị (Admin): Đặt tại `src/app/admin/tu-dang-ky/...` (tận dụng chung Layout/Header của Admin cũ nhưng có menu và tính năng độc lập).
- **Cơ sở dữ liệu (Prisma Schema):** Sẽ tạo các Bảng (Models) mới hoàn toàn (ví dụ: `SelfReg_Device`, `SelfReg_HISConfig`, `SelfReg_Log`...) để đảm bảo không dính dáng, không làm thay đổi các bảng dữ liệu của hệ thống Lấy số hiện tại.


