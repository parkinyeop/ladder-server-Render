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
const clientBuildPath = path.join(__dirname, '../Ladder-Game/0516_007_node');

// ✅ 공통 미들웨어
app.use(cors());
app.use(express.json());

// ✅ 정적 파일 서빙
app.use(express.static(clientBuildPath));


// ✅ 인증 없이 허용할 경로
app.use('/auth', authRouter);

// ✅ 인증이 필요한 라우터
app.use('/coin', verifyToken, coinRouter);
app.use('/api/reward', verifyToken, rewardRouter); // ✅ 보상 처리 라우터는 인증 필수
app.use('/api/multipliers', multipliersRouter);

// ✅ index.html 반환
app.get('/', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});