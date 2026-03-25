import axios from 'axios';
import crypto from 'crypto'

const API_KEY = "qlM5QRf7UwgSntqJvc4YiK6us6waYJ3pIfygz5TQjNuYgdyt7WhpjGysWLtqJoxC"
const SECRET = "PXTm09KlyRYC63iMToLhbdaOh7PTo8vZ8DbraSJ1LzGee7q7hEKhgpDMDggvtT03"

const BASE = "https://testnet.binance.vision"

function sign(query){
    return crypto.createHmac("sha256",SECRET).update(query).digest("hex")
}

async function placeOrder(side) {
    const timestamp = Date.now()
    const query = `symbol=BTCUSDT&side=${side}&type=MARKET&quantity=0.001&timestamp=${timestamp}`
    const signature = sign(query)

    const url = `${BASE}/api/v3/order?${query}&signature=${signature}`

    const res = await axios.post(url,null,{
        headers:{
            "X-MBX-APIKEY":API_KEY,
        },
    })

    console.log(res.data)
}

async function run() {
    await placeOrder("BUY")
    await new Promise(r => setTimeout(r,1000))
    await placeOrder("SELL")
}

run()