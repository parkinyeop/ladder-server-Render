// controllers/coinController.js
const pool = require('../db');

// 잔액 조회
exports.getBalance = async (req, res) => {
  const { user_id } = req.params;
  console.log("📥 getBalance 요청됨: user_id =", user_id); // ✅ 디버깅
  
  try {
    const result = await pool.query(
      'SELECT balance FROM coins WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user_id, balance: result.rows[0].balance });
  } catch (err) {
    console.error('🔴 getBalance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 잔액 업데이트
exports.updateBalance = async (req, res) => {
  const { user_id } = req.params;
  const { amount } = req.body;

  try {
    const result = await pool.query(
      `UPDATE coins SET balance = balance + $1 WHERE user_id = $2 RETURNING balance`,
      [amount, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user_id, updated_balance: result.rows[0].balance });
  } catch (err) {
    console.error('🔴 updateBalance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};