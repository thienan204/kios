#!/bin/bash

echo "======================================"
echo "    BẮT ĐẦU CẬP NHẬT KIOSK SERVER     "
echo "======================================"

echo "[1/3] Kéo code mới nhất từ Git..."
git pull origin main

echo "[2/3] Build và khởi động lại Kiosk bằng Docker..."
docker-compose up -d --build

echo "[3/3] Cập nhật cấu trúc Database (Prisma push)..."
# Chạy db push không cần interactive (-it) để script không bị lỗi môi trường
docker exec kiosklayso-web npx prisma@6.3.0 db push --skip-generate

echo "======================================"
echo "       CẬP NHẬT THÀNH CÔNG!           "
echo "======================================"
