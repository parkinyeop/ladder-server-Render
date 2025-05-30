const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // ✅ 이거 사용함

// ✅ login 요청을 controller로 위임
router.post('/login', authController.login);

module.exports = router;