const { mnemonicToWalletKey, WalletContractV4, internal } = require('@ton/ton');
const { TonClient } = require('@ton/ton');
const { getHttpEndpoint } = require('@orbs-network/ton-access');
require('dotenv').config();

async function sendTransaction(toAddress, amountTon) {
  // 1. TON 엔드포인트 설정
  const endpoint = await getHttpEndpoint({ network: 'testnet' });
  const client = new TonClient({ endpoint });

  // 2. 니모닉 -> 키 변환
  const mnemonic = process.env.TON_MNEMONIC.split(' ');
  const keyPair = await mnemonicToWalletKey(mnemonic);

  // 3. 지갑 인스턴스 생성
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const walletContract = client.open(wallet);
  const sender = walletContract.sender(keyPair.secretKey);

  // 4. 트랜잭션 전송
  await walletContract.send(sender, {
    to: toAddress,
    value: BigInt(Math.floor(amountTon * 1e9)), // 1 TON = 10^9 nanoTON
    body: internal({
      value: BigInt(0),
      bounce: false,
    }),
  });

  console.log(`✅ 전송 완료: ${amountTon} TON → ${toAddress}`);
}

module.exports = { sendTransaction };
