const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // ✅ 이거 사용함

// ✅ login 요청을 controller로 위임
router.post('/login', authController.login);

// Telegram 로그인 라우트 추가
router.post('/telegram', authController.telegramLogin);

module.exports = router;