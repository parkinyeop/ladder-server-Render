# Unity WebGL Build Guide for Render Deployment

## 빌드 설정

### 1. Player Settings
```
Company Name: LadderBlockchain
Product Name: Ladder Game
Version: 1.0.0

Platform Settings - WebGL:
- Compression Format: Brotli
- Name Files As Hashes: ✅
- Data caching: ✅
- Decompression Fallback: ❌
```

### 2. Build Settings
```
Platform: WebGL
Target Architecture: WebAssembly
Development Build: ❌ (배포용)
Script Debugging: ❌
Deep Profiling: ❌
```

### 3. Optimization
```
- Managed Stripping Level: High
- Strip Engine Code: ✅
- Script Call Optimization: Fast but no Exceptions
- IL2CPP Code Generation: Faster (smaller) builds
```

### 4. Memory & Performance
```
- Memory Size: 512MB
- Enable Exceptions: None
- WebAssembly Streaming: ✅
- WebAssembly Threading: ❌ (호환성을 위해)
```

## 빌드 명령어

### Unity CLI 빌드 (자동화용)
```bash
/Applications/Unity/Hub/Editor/[VERSION]/Unity.app/Contents/MacOS/Unity \
  -batchmode \
  -quit \
  -projectPath "$(pwd)" \
  -buildTarget WebGL \
  -buildPath "$(pwd)/WebGL-Build" \
  -logFile build.log
```

## 배포 준비

### 1. 빌드 후 파일 구조
```
WebGL-Build/
├── index.html
├── Build/
│   ├── [game].data
│   ├── [game].framework.js
│   ├── [game].loader.js
│   └── [game].wasm
└── TemplateData/
    └── (템플릿 파일들)
```

### 2. 서버 복사 명령어
```bash
# Render 서버 폴더로 복사
cp -r WebGL-Build/* ./Ladder-Server/public/
```

## 성능 최적화 팁

### 1. 파일 크기 최적화
- Brotli 압축 사용 (80% 압축률)
- 사용하지 않는 에셋 제거
- Texture 해상도 최적화

### 2. 로딩 속도 개선
- Progressive Download 활성화
- 필수 에셋만 초기 로드
- 나머지는 Runtime에 로드

### 3. 브라우저 호환성
- WebAssembly 지원 브라우저 타겟
- Mobile Safari 호환성 고려
- CORS 설정 확인

## Render 배포 체크리스트

✅ Brotli 압축 활성화
✅ 파일 크기 < 100MB (권장)
✅ HTTPS 필수 (WebGL 요구사항)
✅ CORS 헤더 설정
✅ 모바일 반응형 지원
✅ 로딩 화면 커스터마이징

## 환경별 URL 설정

### Development
```
API_URL: http://localhost:3000
```

### Production (Render)
```
API_URL: https://your-app.onrender.com
``` 