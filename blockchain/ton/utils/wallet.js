require('dotenv').config(); // .env 파일 로드

const { mnemonicToWalletKey } = require('@ton/crypto'); // ✅ 이게 핵심!
const { TonClient } = require('@ton/ton');
const { WalletContractV4 } = require('@ton/ton');
const { getHttpEndpoint } = require('@orbs-network/ton-access');

async function getWalletAddress() {
  const mnemonic = process.env.TON_MNEMONIC;
  if (!mnemonic) {
    console.error('❌ TON_MNEMONIC not found in .env');
    return;
  }

  const words = mnemonic.trim().split(' ');
  const keyPair = await mnemonicToWalletKey(words);

  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const address = wallet.address.toString();
  console.log(`📮 내 TON 지갑 주소: ${address}`);
}

getWalletAddress();