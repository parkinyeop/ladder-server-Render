// middleware/authMiddleware.js

require('dotenv').config(); // .env에서 JWT_SECRET 불러오기
const jwt = require('jsonwebtoken');

// ✅ 시크릿 키 정의
const SECRET_KEY = process.env.JWT_SECRET;

/**
 * 🔐 JWT 인증 미들웨어
 * - 보호된 API에서 사용 (ex: 코인 조회, 보상 처리 등)
 * - 토큰이 없거나 유효하지 않으면 요청을 차단
 */
function verifyToken(req, res, next) {
  // 1. 요청 헤더에서 Authorization 값 추출 (형식: "Bearer <token>")
  const authHeader = req.headers['authorization'];

  // 2. 토큰만 분리해서 추출
  const token = authHeader && authHeader.split(' ')[1]; // 공백 기준 분할
  console.log("🧪 현재 사용 중인 SECRET_KEY:", SECRET_KEY);

  // 3. 토큰이 없는 경우 → 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // 4. 토큰 검증 시도
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("❌ 토큰 인증 실패:", err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }

    // 5. 검증 성공 → 요청 객체에 사용자 정보 추가
    req.user_id = decoded.user_id; // ✅ 명시적으로 req.user_id에 저장
    req.user = decoded; // decoded는 { user_id: ... } 형식
    next(); // 다음 미들웨어 또는 라우터로 이동
  });
}

module.exports = { verifyToken }; // ✅ 반드시 객체 형태로 export