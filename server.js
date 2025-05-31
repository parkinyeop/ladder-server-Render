require('dotenv').config(); // ✅ 가장 위에 있어야 함
const express = require('express');
const cors = require('cors');
const path = require('path');

const coinRouter = require('./routes/coin');
const authRouter = require('./routes/auth');
const rewardRouter = require('./routes/reward'); // ✅ reward 라우터 import
const multipliersRouter = require('./routes/multipliers');

// ✅ 올바른 방법
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
const PORT = 3000;

// ✅ Unity WebGL 빌드 경로
const clientBuildPath = path.join(__dirname, 'public');

// ✅ Unity WebGL MIME type 설정
express.static.mime.define({
  'application/wasm': ['wasm'],
  'application/javascript': ['js'],
  'application/octet-stream': ['data', 'unityweb'],
  'text/javascript': ['jsgz'],
  'application/gzip': ['gz'],
  'application/x-gzip': ['gz']
});

// ✅ 공통 미들웨어
app.use(cors({
  origin: ['http://localhost:3000', 'https://laddergame.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ✅ Unity WebGL 파일들에 대한 특별한 처리
app.use('/Build', express.static(path.join(clientBuildPath, 'Build'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js.gz')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Content-Encoding', 'gzip');
    } else if (filePath.endsWith('.wasm.gz')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Content-Encoding', 'gzip');
    } else if (filePath.endsWith('.data.gz')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Encoding', 'gzip');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    } else if (filePath.endsWith('.data')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    } else if (filePath.endsWith('.unityweb')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

// ✅ API URL 정보 제공 엔드포인트
app.get('/api/config', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const apiUrl = isProduction ? 'https://laddergame.onrender.com' : 'http://localhost:3000';
  
  res.json({
    apiUrl: apiUrl,
    environment: isProduction ? 'production' : 'development'
  });
});

// ✅ 정적 파일 서빙 (Unity WebGL 전용 설정 추가)
app.use(express.static(clientBuildPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js.gz')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.wasm.gz')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.data.gz')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.data')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    } else if (filePath.endsWith('.unityweb')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

// ✅ 인증 없이 허용할 경로
app.use('/auth', authRouter);

// ✅ 인증이 필요한 라우터
app.use('/coin', verifyToken, coinRouter);
app.use('/api/reward', verifyToken, rewardRouter); // ✅ 보상 처리 라우터는 인증 필수
app.use('/api/multipliers', multipliersRouter);

// ✅ 기본 라우트 핸들러 - Unity WebGL 게임 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
  console.log(`🌐 API URL: ${process.env.NODE_ENV === 'production' ? 'https://laddergame.onrender.com' : 'http://localhost:3000'}`);
});