// routes/coin.js
const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coinController');
const { verifyToken } = require('../controllers/jwt'); // ✅ 토큰 검증 함수 불러오기


// 정확히 이 경로가 있어야 합니다
router.get('/:user_id', verifyToken, coinController.getBalance);
router.post('/:user_id', verifyToken, coinController.updateBalance);

module.exports = router;