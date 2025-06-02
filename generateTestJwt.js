require('dotenv').config(); // .env 파일에서 JWT_SECRET을 로드하기 위해
const { generateToken } = require('./controllers/jwt');

const userIdToGenerateTokenFor = 'editor_test_user';
const testJwt = generateToken(userIdToGenerateTokenFor);

console.log('--- BEGIN EDITOR TEST JWT ---');
console.log(testJwt);
console.log('--- END EDITOR TEST JWT ---'); 