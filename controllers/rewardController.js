// ✅ controllers/rewardController.js (DB에서 multiplier factor 사용 버전)
const pool = require('../db');

/**
 * 🧮 사다리 결과 계산 함수
 */
function calculateResultIndex(ladderMap, startIndex) {
  let x = startIndex;
  const height = ladderMap.length;
  const width = ladderMap[0].length; // ladderMap[y][x]에서 x의 최대값은 width-1

  console.log(`[SERVER] 탐색 시작: startIndex=${x}, stepCount=${height}, width=${width}`);

  for (let y = 0; y < height; y++) {
    // 이동 가능성 체크
    const hasRight = (x < width && ladderMap[y][x]);
    const hasLeft = (x > 0 && ladderMap[y][x - 1]);
    
    console.log(`[SERVER] y=${y}, currentX=${x}, hasRight=${hasRight}, hasLeft=${hasLeft}, width=${width}`);

    let moved = false;
    
    // ✅ 클라이언트와 동일한 우선순위: 오른쪽 먼저, 왼쪽 나중에
    if (hasRight) {
      x++;
      moved = true;
      console.log(`[SERVER] 오른쪽으로 이동: x=${x}`);
    }
    else if (hasLeft) {
      x--;
      moved = true;
      console.log(`[SERVER] 왼쪽으로 이동: x=${x}`);
    }

    console.log(`[SERVER] y=${y} 완료: x=${x}, moved=${moved}`);
  }

  console.log(`[SERVER] 최종 결과: final_index=${x}`);
  return x;
}

const rewardController = {
  /**
   * 🎯 사다리 결과 검증 및 보상 처리
   */
  processReward: async (req, res) => {
    try {
      // ✅ 요청 데이터 파싱
      const {
        bet_amount,
        vertical_count,
        start_index: client_start_index, // 클라이언트에서 보낸 값
        goal_index,
        ladder_map,
        start_selected // ✅ 유저가 직접 스타트 선택했는지 여부
      } = req.body;

      const user_id = req.user?.user_id;

      // ✅ 실제 사용할 startIndex 결정 (새로운 룰: 항상 랜덤)
      let actual_start_index = Math.floor(Math.random() * vertical_count);
      console.log(`[SERVER] 실제 시작 위치: ${actual_start_index} (항상 랜덤 생성, 범위: 0-${vertical_count-1})`);

      // 🎯 스타트 선택은 배당 계산에만 영향 (예측 개념)
      if (start_selected) {
        console.log(`[SERVER] 유저가 스타트 버튼 예측: ${client_start_index} (배당 적용)`);
      } else {
        console.log(`[SERVER] 유저가 스타트 버튼 선택 안함 (기본 배당)`);
      }

      // ✅ ladder_map 로그 출력 (주석 해제)
      console.log('[SERVER] ladder_map:', JSON.stringify(ladder_map));

      // ✅ 유효성 검사
      if (
        typeof bet_amount !== 'number' ||
        typeof vertical_count !== 'number' ||
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

      // ✅ DB에서 해당 세로줄 개수에 맞는 goal_factor, start_factor 가져오기
      const factorResult = await pool.query(
        'SELECT goal_factor, start_factor FROM multipliers WHERE vertical_count = $1', 
        [vertical_count]
      );
      
      if (factorResult.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `세로줄 ${vertical_count}개에 대한 배율 설정을 찾을 수 없습니다.` 
        });
      }
      
      let { goal_factor, start_factor } = factorResult.rows[0];

      // ✅ 배율 계산 - 올바른 공식 사용
      let multiplier;
      if (start_selected) {
        // 🎯 골+스타트 선택: goal_factor * vertical_count * start_factor * vertical_count
        multiplier = goal_factor * vertical_count * start_factor * vertical_count;
        console.log(`[MULTIPLIER] 골+스타트 모드: ${goal_factor} * ${vertical_count} * ${start_factor} * ${vertical_count} = ${multiplier}`);
      } else {
        // 🎲 골만 선택: vertical_count * goal_factor
        multiplier = vertical_count * goal_factor;
        console.log(`[MULTIPLIER] 골만 모드: ${vertical_count} * ${goal_factor} = ${multiplier}`);
      }

      // ✅ 결과 계산 (실제 사용된 startIndex로)
      const final_index = calculateResultIndex(ladder_map, actual_start_index);
      
      // ✅ 새로운 성공 판단 룰
      let is_success;
      if (start_selected) {
        // 🎯 골+스타트 선택: 선택한 스타트에서 시작하고 선택한 골에 도착해야 성공
        is_success = (actual_start_index === client_start_index) && (final_index === goal_index);
        console.log(`[SUCCESS CHECK] 골+스타트 모드: start_match=${actual_start_index === client_start_index}, goal_match=${final_index === goal_index}, result=${is_success}`);
      } else {
        // 🎲 골만 선택: 골에만 도착하면 성공 (시작점 무관)
        is_success = (final_index === goal_index);
        console.log(`[SUCCESS CHECK] 골만 모드: goal_match=${final_index === goal_index}, result=${is_success}`);
      }

      const reward_amount = bet_amount * multiplier;

      if (is_success) {
        const reward_amount = bet_amount * multiplier;

        // ✅ 보상 지급
        await pool.query(
          'UPDATE coins SET balance = balance + $1 WHERE user_id = $2',
          [reward_amount, user_id]
        );

        // ✅ 최신 잔액 조회
        const updatedBalanceResult = await pool.query(
          'SELECT balance FROM coins WHERE user_id = $1',
          [user_id]
        );
        const updatedBalance = updatedBalanceResult.rows[0]?.balance;

        return res.json({
          success: true,
          is_success: true,
          final_index,
          actual_start_index, // ✅ 실제 사용된 시작점 전달
          reward_amount,
          multiplier,
          balance: updatedBalance
        });

      } else {
        // ❌ 실패 시 차감 - 배팅 금액만 차감
        console.log(`[DEDUCT] 실패 처리: bet_amount=${bet_amount} 차감 예정`);
        
        // 차감 전 잔액 조회
        const beforeDeductResult = await pool.query(
          'SELECT balance FROM coins WHERE user_id = $1',
          [user_id]
        );
        const beforeBalance = beforeDeductResult.rows[0]?.balance;
        console.log(`[DEDUCT] 차감 전 잔액: ${beforeBalance}`);
        
        await pool.query(
          'UPDATE coins SET balance = balance - $1 WHERE user_id = $2',
          [bet_amount, user_id]
        );

        // ✅ 최신 잔액 조회
        const updatedBalanceResult = await pool.query(
          'SELECT balance FROM coins WHERE user_id = $1',
          [user_id]
        );
        const updatedBalance = updatedBalanceResult.rows[0]?.balance;
        
        console.log(`[DEDUCT] 차감 후 잔액: ${updatedBalance}`);
        console.log(`[DEDUCT] 실제 차감된 금액: ${beforeBalance - updatedBalance}`);

        return res.json({
          success: true,
          is_success: false,
          final_index,
          actual_start_index, // ✅ 실제 사용된 시작점 전달
          reward_amount: 0,
          multiplier: 0,
          balance: updatedBalance
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