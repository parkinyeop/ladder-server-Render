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
const { startTelegramBot } = require('./telegramBot'); // telegramBot.js에서 함수 가져오기

const app = express();
const PORT = process.env.PORT || 3000; // Render 포트 호환성 확인

// ✅ Unity WebGL 빌드 경로
const clientBuildPath = path.join(__dirname, 'public');

// ✅ Unity WebGL MIME type 설정
express.static.mime.define({
  'application/wasm': ['wasm'],
  'application/javascript': ['js'],
  'application/octet-stream': ['data', 'unityweb']
});

// ✅ 공통 미들웨어
app.use(cors({
  origin: ['http://localhost:3000', 'https://laddergame.onrender.com', process.env.GAME_URL].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ✅ Unity WebGL 파일들에 대한 특별한 처리
app.use('/Build', express.static(path.join(clientBuildPath, 'Build'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.data')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.unityweb')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

// ✅ API URL 정보 제공 엔드포인트
app.get('/api/config', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  // API URL은 Render에서 설정한 주소 또는 환경 변수를 따르도록 수정
  const defaultApiUrl = `http://localhost:${PORT}`;
  const apiUrl = isProduction ? (process.env.API_URL || 'https://laddergame.onrender.com') : defaultApiUrl;
  
  res.json({
    apiUrl: apiUrl,
    environment: isProduction ? 'production' : 'development'
  });
});

// ✅ 정적 파일 서빙 (Unity WebGL 전용 설정 추가)
app.use(express.static(clientBuildPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (filePath.endsWith('.data')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
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

// Webhook 엔드포인트 추가
app.post('/webhook', (req, res) => {
  if (telegramBotInstance) {
    telegramBotInstance.processUpdate(req.body);
    res.sendStatus(200);
  } else {
    console.error("[SERVER] 텔레그램 봇이 초기화되지 않았습니다.");
    res.sendStatus(500);
  }
});

// ✅ 기본 라우트 핸들러 - Unity WebGL 게임 서빙 (API 라우트 뒤에 위치)
app.get('/', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ✅ 서버 시작 전에 텔레그램 봇 시작 (조건부 실행)
if (process.env.RUN_TELEGRAM_BOT === 'true') {
  const telegramBotInstance = startTelegramBot(); 
  if (!telegramBotInstance) {
    console.error("[SERVER] 텔레그램 봇 시작에 실패했습니다. (RUN_TELEGRAM_BOT=true 설정됨)");
  } else {
    console.log("[SERVER] 텔레그램 봇 인스턴스가 시작 명령에 따라 시작되었습니다. (RUN_TELEGRAM_BOT=true)");
  }
} else {
  console.log("[SERVER] RUN_TELEGRAM_BOT 환경 변수가 'true'로 설정되지 않았거나 존재하지 않아 텔레그램 봇을 시작하지 않습니다.");
  console.log(`[SERVER] 현재 RUN_TELEGRAM_BOT 값: ${process.env.RUN_TELEGRAM_BOT}`);
}

// ✅ 서버 시작
const startServer = () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] 🚀 Server started on port ${PORT}`); // Render에서 실제 할당된 포트 확인용
    const apiUrl = process.env.NODE_ENV === 'production' ? (process.env.API_URL || 'https://laddergame.onrender.com') : `http://localhost:${PORT}`;
    console.log(`[SERVER] 🌐 API URL: ${apiUrl}`);
    if(process.env.GAME_URL) {
      console.log(`[SERVER] 🎮 Game URL for Bot: ${process.env.GAME_URL}`);
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[SERVER] ⚠️ Port ${PORT} is already in use. Exiting process...`);
      process.exit(1); // 프로세스를 종료하고 Render가 재시작하도록 함
    } else {
      console.error('[SERVER] ❌ Server error:', error);
    }
  });

  // 프로세스 종료 시 서버 정리
  process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('[SERVER] Server closed');
      process.exit(0);
    });
  });
};

startServer();