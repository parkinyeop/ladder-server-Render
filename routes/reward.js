const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
console.log("✅ authMiddleware:", auth); // { verifyToken: [Function: verifyToken] }

//const verifyToken = auth.verifyToken;

const { verifyToken } = require('../middleware/authMiddleware');
console.log("✅ verifyToken:", typeof verifyToken); // function

const rewardController = require('../controllers/rewardController');

// ✅ 디버깅 로그
console.log('🧪 rewardController:', rewardController);
console.log('🧪 processReward:', rewardController.processReward);

router.post('/', verifyToken, rewardController.processReward); // ✅ 여기서 undefined면 문제 발생

module.exports = router;