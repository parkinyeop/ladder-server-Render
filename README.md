# Ladder Blockchain Server

## 배포 준비

### 환경변수 설정
1. `.env.example`을 참고하여 `.env` 파일 생성
2. PostgreSQL 데이터베이스 설정
3. JWT 시크릿 키 설정

### 로컬 실행
```bash
npm install
npm start
```

### Render 배포
1. GitHub에 푸시
2. Render에서 Web Service 생성
3. 환경변수 설정
4. 자동 배포
