#!/bin/bash
# 스왑 메모리를 2GB에서 8GB로 증가시키는 스크립트

echo "=== 스왑 메모리 증가 스크립트 ==="
echo "현재 스왑을 확인합니다..."
free -h

echo ""
echo "기존 스왑 파일을 비활성화합니다..."
sudo swapoff -a

echo ""
echo "8GB 스왑 파일을 생성합니다 (약 1-2분 소요)..."
sudo dd if=/dev/zero of=/swapfile bs=1G count=8 status=progress

echo ""
echo "스왑 파일 권한을 설정합니다..."
sudo chmod 600 /swapfile

echo ""
echo "스왑 파일을 포맷합니다..."
sudo mkswap /swapfile

echo ""
echo "스왑을 활성화합니다..."
sudo swapon /swapfile

echo ""
echo "재부팅 후에도 유지되도록 /etc/fstab에 등록합니다..."
if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "fstab에 등록 완료!"
else
    echo "이미 fstab에 등록되어 있습니다."
fi

echo ""
echo "=== 완료! ==="
echo "새로운 스왑 상태:"
free -h
swapon --show
