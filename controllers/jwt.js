// controllers/jwt.js

const jwt = require('jsonwebtoken');

// 시크릿 키는 .env 파일 또는 서버 설정에 넣는 것이 안전합니다
// jwt.js 상단
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_key';

// ✅ 토큰 생성 함수
exports.generateToken = (user_id) => {
  const payload = { user_id };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  console.log("🛡️ 생성된 토큰:", token); // ✅ 이 로그 추가
  console.log("🧪 현재 사용 중인 SECRET_KEY:", SECRET_KEY);
  return token;
};

// ✅ 토큰 검증 함수 (미들웨어처럼 사용 가능)
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("🧪 현재 사용 중인 SECRET_KEY:", SECRET_KEY);
  // Authorization 헤더가 없거나 Bearer 형식이 아닌 경우
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // ✅ 요청에 사용자 정보 추가
    next(); // 다음 미들웨어 또는 라우터로 이동
  } catch (err) {
    console.error('🔴 토큰 검증 실패:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};