// ✅ controllers/rewardController.js (DB에서 multiplier factor 사용 버전)
const pool = require('../db');

/**
 * 🧮 사다리 결과 계산 함수
 */
function calculateResultIndex(ladderMap, startIndex) {
  let x = startIndex;
  const height = ladderMap.length;
  const width = ladderMap[0].length;

  for (let y = 0; y < height; y++) {
    const left = (x > 0 && ladderMap[y][x - 1]) ? "◀" : "";
    const right = (x < width - 1 && ladderMap[y][x]) ? "▶" : "";
    console.log(`[🧭] y=${y}, x=${x}, move=${left}${right}`);

    if (x > 0 && ladderMap[y][x - 1]) x--;
    else if (x < width - 1 && ladderMap[y][x]) x++;
  }

  return x;
}

const rewardController = {
  /**
   * 🎯 사다리 결과 검증 및 보상 처리
   */
  processReward: async (req, res) => {
    try {
      // ✅ 요청 데이터 파싱
      const { bet_amount, vertical_count, start_index, goal_index, ladder_map } = req.body;
      const user_id = req.user?.user_id;

      // ✅ 유효성 검사
      if (
        typeof bet_amount !== 'number' ||
        typeof vertical_count !== 'number' ||
        typeof start_index !== 'number' ||
        typeof goal_index !== 'number' ||
        !Array.isArray(ladder_map)
      ) {
        return res.status(400).json({ success: false, message: '잘못된 요청 형식입니다.' });
      }

      // ✅ 사용자 잔액 확인
      const balanceResult = await pool.query('SELECT balance FROM coins WHERE user_id = $1', [user_id]);
      const balance = balanceResult.rows[0]?.balance;

      if (balance === undefined) {
        return res.status(404).json({ success: false, message: '사용자 정보를 찾을 수 없습니다.' });
      }

      if (balance < bet_amount) {
        return res.status(400).json({ success: false, message: '잔액이 부족합니다.' });
      }

      // ✅ DB에서 goal_factor, start_factor 가져오기
      const factorResult = await pool.query('SELECT goal_factor, start_factor FROM multipliers LIMIT 1');
      const { goal_factor, start_factor } = factorResult.rows[0];

      const final_index = calculateResultIndex(ladder_map, start_index);
      const is_success = final_index === goal_index;
      const multiplier = vertical_count * vertical_count * goal_factor * start_factor;

      console.log(`[🔍 DEBUG] user=${user_id}, start=${start_index}, final=${final_index}, goal=${goal_index}, success=${is_success}`);
      console.log(`[🧪 MULTIPLIER] vertical_count=${vertical_count}, goal_factor=${goal_factor}, start_factor=${start_factor} → multiplier=${multiplier}`);
      console.log(`[📦 BALANCE BEFORE] ${balance}`);
      console.log(`[🧪 ladderMap size] rows=${ladder_map.length}, cols=${ladder_map[0]?.length ?? 'undefined'}`);

      if (is_success) {
        const reward_amount = bet_amount * multiplier;

        await pool.query('UPDATE coins SET balance = balance + $1 WHERE user_id = $2', [reward_amount, user_id]);

        return res.json({
          success: true,
          is_success: true,
          final_index,
          reward_amount,
          multiplier
        });
      } else {
        await pool.query('UPDATE coins SET balance = balance - $1 WHERE user_id = $2', [bet_amount, user_id]);

        return res.json({
          success: true,
          is_success: false,
          final_index,
          reward_amount: 0,
          multiplier: 0
        });
      }

    } catch (err) {
      console.error('🛑 보상 처리 중 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 내부 오류',
        detail: err.message
      });
    }
  }
};

module.exports = rewardController;