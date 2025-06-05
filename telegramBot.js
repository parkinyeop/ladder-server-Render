// require('dotenv').config(); 
const TelegramBot = require('node-telegram-bot-api');

function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error('오류: TELEGRAM_BOT_TOKEN이 설정되지 않았습니다. .env 파일을 확인해주세요.');
    return null; 
  }

  const gameUrl = process.env.GAME_URL || 'https://laddergame.onrender.com';
  const webhookUrl = process.env.WEBHOOK_URL || 'https://laddergame.onrender.com/webhook';

  // Webhook 모드로 봇 초기화
  const bot = new TelegramBot(token, { webHook: {
    port: process.env.PORT || 3000,
    path: '/webhook'
  }});

  // Webhook 설정
  bot.setWebHook(webhookUrl).then(() => {
    console.log(`[BOT] Webhook이 성공적으로 설정되었습니다: ${webhookUrl}`);
  }).catch(error => {
    console.error(`[BOT] Webhook 설정 실패:`, error);
  });

  console.log('텔레그램 봇 로직이 초기화되었습니다...');

  bot.onText(/\/(play|start)/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    console.log(`[BOT] 명령어 수신: ${msg.text}, 사용자 ID: ${userId}, 채팅 ID: ${chatId}`);
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 게임 시작하기!', web_app: { url: gameUrl } }]
        ]
      }
    };
    bot.sendMessage(chatId, '아래 버튼을 눌러 게임을 시작하세요:', opts);
  });

  bot.on('polling_error', (error) => {
    console.error(`[BOT] 텔레그램 봇 폴링 오류: ${error.code} - ${error.message}`);
    if (error.code === 'EFATAL') {
      console.error("[BOT] 치명적인 폴링 오류 발생. 봇 관련 로직을 재시작해야 할 수 있습니다.");
    }
  });

  bot.on('webhook_error', (error) => {
    console.error(`[BOT] 텔레그램 봇 웹훅 오류: ${error.code} - ${error.message}`);
  });
  
  console.log('[BOT] 텔레그램 봇 명령어 수신 준비 완료.');
  return bot; 
}

module.exports = { startTelegramBot }; 