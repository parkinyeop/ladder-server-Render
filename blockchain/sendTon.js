// sendTon.js
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { TonClient, WalletContractV4, internal, Address } = require('@ton/ton');
const { getHttpEndpoint } = require('@orbs-network/ton-access');

async function sendTon() {
  const mnemonic = "복사한 니모닉 24개 입력"; // 꼭 따옴표로 감싼 한 줄 문자열로!
  const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
  const endpoint = await getHttpEndpoint();
  const client = new TonClient({ endpoint });

  const wallet = WalletContractV4.create({
    publicKey: keyPair.publicKey,
    workchain: 0
  });

  const sender = client.open(wallet);
  const seqno = await sender.getSeqno();

  await sender.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno,
    messages: [
      internal({
        to: Address.parse("받는사람_지갑주소"),
        value: '0.01', // TON 단위 (0.01 = 10^7 나노톤)
        bounce: false
      })
    ]
  });

  console.log('🚀 TON 전송 완료');
}
sendTon();