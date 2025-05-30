require('dotenv').config();

const { mnemonicToWalletKey } = require('@ton/crypto'); // ✅ crypto에서 가져옴
const { WalletContractV4, TonClient } = require('@ton/ton');
const { getHttpEndpoint } = require('@orbs-network/ton-access');

async function getBalance() {
  const mnemonic = process.env.TON_MNEMONIC;
  if (!mnemonic) {
    console.error("❌ TON_MNEMONIC not found in .env");
    return;
  }

  const keyPair = await mnemonicToWalletKey(mnemonic.split(' '));

  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const address = wallet.address.toString();
  console.log(`📮 지갑 주소: ${address}`);

  const endpoint = await getHttpEndpoint();
  const client = new TonClient({ endpoint });

  const balance = await client.getBalance(wallet.address);
  console.log(`💰 잔액: ${Number(balance) / 1e9} TON`);
}

getBalance();