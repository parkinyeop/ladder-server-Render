const pool = require('../db');
const { generateToken } = require('./jwt');
const crypto = require('crypto');

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

exports.telegramLogin = async (req, res) => {
  const { initData } = req.body;
  console.log("[AUTH] Telegram login request received");

  if (!initData) {
    console.log("[AUTH] 🔴 initData is missing");
    return res.status(400).json({ error: "initData is required" });
  }

  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
        console.error("[AUTH] 🔴 TELEGRAM_BOT_TOKEN is not set in environment variables.");
        return res.status(500).json({ error: "Internal server configuration error: Bot token not found." });
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash'); // hash는 검증 데이터에서 제외

    const dataCheckArr = [];
    for (const [key, value] of params.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();

    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    console.log(`[AUTH] Received hash: ${hash}`);
    console.log(`[AUTH] Calculated hash: ${calculatedHash}`);

    if (calculatedHash !== hash) {
      console.log("[AUTH] 🔴 Hash validation failed. Data might be tampered or from an unauthorized source.");
      return res.status(403).json({ error: "Invalid data: Hash mismatch" });
    }

    console.log("[AUTH] ✅ Hash validation successful.");

    const user = JSON.parse(params.get('user'));
    const telegram_id = user.id;
    const first_name = user.first_name;
    const last_name = user.last_name || '';
    const username = user.username || '';

    console.log(`[AUTH] User data from Telegram: id=${telegram_id}, first_name=${first_name}, last_name=${last_name}, username=${username}`);

    let dbUser;
    const existingUserResult = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    if (existingUserResult.rows.length > 0) {
      dbUser = existingUserResult.rows[0];
      console.log(`[AUTH] Existing user found in DB: user_id=${dbUser.user_id}, telegram_id=${dbUser.telegram_id}`);
      if (dbUser.first_name !== first_name || dbUser.last_name !== last_name) {
        await pool.query(
          'UPDATE users SET first_name = $1, last_name = $2, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $3',
          [first_name, last_name, telegram_id]
        );
        console.log(`[AUTH] User info updated for telegram_id: ${telegram_id}`);
      }

      // ★★★ 기존 사용자의 코인 정보 확인 및 필요시 지급 ★★★
      try {
        const coinRecordResult = await pool.query('SELECT balance FROM coins WHERE user_id = $1', [dbUser.user_id]);
        if (coinRecordResult.rows.length === 0) { // 코인 레코드가 없으면
          const initialCoinAmount = 100; // 초기 지급 코인 또는 기본값
          await pool.query(
            'INSERT INTO coins (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2',
            [dbUser.user_id, initialCoinAmount]
          );
          console.log(`[AUTH_RECOVERY] No coin record found for existing user ${dbUser.user_id}. Granted ${initialCoinAmount} coins.`);
          // 필요하다면, 클라이언트에게 잔액이 방금 복구되었음을 알리는 추가 정보를 응답에 포함할 수 있습니다.
          // 예를 들어, res.json 응답 객체에 isBalanceRecovered: true 같은 플래그를 추가할 수 있습니다.
        } else {
          console.log(`[AUTH] Coin record found for user ${dbUser.user_id}, balance: ${coinRecordResult.rows[0].balance}`);
        }
      } catch (coinCheckError) {
        console.error(`[AUTH_ERROR] Error checking/granting coins for existing user ${dbUser.user_id}:`, coinCheckError);
      }

    } else {
      console.log(`[AUTH] New user. Creating account for telegram_id: ${telegram_id}`);
      const newUserResult = await pool.query(
        'INSERT INTO users (user_id, password, first_name, last_name, telegram_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [username || `tg_${telegram_id}`, null, first_name, last_name, telegram_id]
      );
      dbUser = newUserResult.rows[0];
      console.log(`[AUTH] New user created in DB: user_id=${dbUser.user_id}, telegram_id=${dbUser.telegram_id}`);

      // 새 사용자에게 코인 100개 지급 (coins 테이블 사용, last_updated 컬럼 없이)
      try {
        const initialCoinAmount = 100;
        await pool.query(
          'INSERT INTO coins (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2',
          [dbUser.user_id, initialCoinAmount]
        );
        console.log(`[AUTH] Initial ${initialCoinAmount} coins granted to new user or updated for user: ${dbUser.user_id}`);
      } catch (coinError) {
        console.error(`[AUTH] 🔴 Error granting initial coins to user ${dbUser.user_id}:`, coinError);
      }
    }

    const token = generateToken(dbUser.user_id);

    console.log(`[AUTH] ✅ JWT token generated for user_id: ${dbUser.user_id}`);
    res.json({
      success: true,
      message: 'Telegram login successful',
      token: token,
      user_id: dbUser.user_id,
      isNewUser: existingUserResult.rows.length === 0
    });

  } catch (err) {
    console.error('[AUTH] 🔴 Telegram login error:', err);
    if (err instanceof SyntaxError) {
        return res.status(400).json({ error: "Invalid initData format" });
    }
    res.status(500).json({ error: 'Server error during Telegram authentication' });
  }
};