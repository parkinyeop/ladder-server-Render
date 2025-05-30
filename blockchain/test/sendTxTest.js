const { sendTransaction } = require('../utils/sendTransaction');

const recipient = 'EQCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // 테스트 주소
const amount = 0.05;

sendTransaction(recipient, amount)
  .then(() => console.log('🎉 전송 성공'))
  .catch((err) => console.error('❌ 전송 실패:', err));