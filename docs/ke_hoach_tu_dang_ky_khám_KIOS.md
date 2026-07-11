# Kế hoạch phát triển chức năng: Tự đăng ký khám trên Kiosk

## 1. Mục tiêu
- Cho phép người bệnh khi đến bệnh viện có thể **tự đăng ký khám bệnh** trực tiếp trên máy Kiosk mà không cần thông qua quầy tiếp đón.
- Đối với bệnh nhân sử dụng Bảo hiểm Y tế (BHYT): Yêu cầu bệnh nhân chèn thẻ Căn cước công dân (CCCD) có gắn chip và thực hiện xác thực khuôn mặt (Face Matching) để đảm bảo chính chủ.

## 2. Yêu cầu nghiệp vụ dự kiến (Draft)
- **Bước 1 (Chọn đối tượng):** Khách hàng chọn loại hình khám (Khám BHYT hoặc Khám Dịch vụ).
- **Bước 2 (Xác thực - dành cho BHYT):** Hệ thống yêu cầu đưa CCCD vào đầu đọc và nhìn vào camera. Kiosk sẽ đọc thông tin chip, quét khuôn mặt và đối chiếu (match).
- **Bước 3 (Kiểm tra BHYT):** Kiosk tự động gọi API lên cổng BHYT hoặc HIS để kiểm tra tuyến, tình trạng thẻ BHYT.
- **Bước 4 (Chọn dịch vụ/phòng khám):** Hiển thị danh sách các phòng khám/khoa để bệnh nhân tự chọn dựa trên triệu chứng hoặc theo chỉ định.
- **Bước 5 (Hoàn tất & In phiếu):** Kiosk in phiếu đăng ký khám (chứa thông tin bệnh nhân, số thứ tự, phòng khám) và đẩy dữ liệu vào phần mềm HIS của bệnh viện.

## 3. Phân tích kỹ thuật (Technical Design - Dự kiến)
Vì ứng dụng chính của chúng ta là Web (Next.js), nên trình duyệt web không thể giao tiếp trực tiếp với đầu đọc CCCD (phần cứng qua cổng USB). Do đó, chúng ta sẽ tận dụng ứng dụng **Desktop Client (Electron)** hiện có của hệ thống để làm "cầu nối".
- **Desktop Client (Electron):** Sẽ tích hợp các thư viện đọc Smartcard (như PC/SC) hoặc gọi SDK của hãng phần cứng để quét dữ liệu thẻ CCCD.
- **Xác thực khuôn mặt Local (Face Matching):** Chúng ta sẽ sử dụng thư viện AI cục bộ (như `face-api.js`) chạy trực tiếp trên Kiosk để so khớp ảnh trích xuất từ chip CCCD với ảnh chụp từ Camera hiện tại. Ưu điểm: Không tốn phí bên thứ 3, hoạt động hoàn toàn nội bộ và rất nhanh.
- **Web App (Next.js):** Giao diện Kiosk sẽ kết nối với Desktop Client (qua WebSocket hoặc Local API) để nhận dữ liệu CCCD và kết quả đối chiếu khuôn mặt.

## 4. Các vấn đề cần làm rõ (Open Questions)
> [!IMPORTANT]
> Vì Bệnh viện đã có sẵn Kiosk tích hợp đầu đọc nhưng phần mềm cũ không đáp ứng được, chúng ta sẽ tự xây dựng module đọc thẻ mới. Cần làm rõ:
> 
> 1. **Model Đầu đọc:** (Bạn sẽ cung cấp sau). Tạm thời chúng ta sẽ thiết kế giao diện theo hướng giả lập (mockup) dữ liệu trả về từ thẻ trước.
> 2. **Tích hợp HIS:** (Chờ thông tin). Cần API của phần mềm HIS hiện tại để Kiosk gọi lệnh "Đăng ký khám" hoặc "Tra cứu BHYT".
