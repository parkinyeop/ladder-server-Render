const pool = require('../db');
const { generateToken } = require('./jwt');

exports.login = async (req, res) => {
  // ✅ 키 이름 통일 (클라이언트에서도 user_id로 보내고 있음)
  const { user_id, password } = req.body;
  console.log("📥 로그인 요청됨:", user_id, password);

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      console.log("❌ 사용자 없음:", user_id);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.password.trim() !== password.trim()) {
      console.log("❌ 비밀번호 불일치");
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.user_id);

    res.json({
      success: true,
      message: 'Login successful',
      user_id: user.user_id,
      token: token
    });
  } catch (err) {
    console.error('🔴 login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};