import axios from "axios"
import crypto, { sign } from "crypto"

const BASE_URL = "https://api.binance.com"

function sign(query, secret) {
    return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

export async function fetchBinanceTrades({ apiKey, secret }) {
  const timestamp = Date.now()

  const queryString = `symbol=BTCUSDT&timestamp=${timestamp}`

  const signature = crypto
    .createHmac("sha256", secret)
    .update(queryString)
    .digest("hex")

  const url = `${BASE_URL}/api/v3/myTrades?${queryString}&signature=${signature}`

  const res = await axios.get(url, {
    headers: {
      "X-MBX-APIKEY": apiKey,
    },
  })

  return res.data
}

