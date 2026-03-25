import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://testnet.binance.vision"

function sign(query, secret = process.env.Secret_Key) {
    return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

export async function fetchAllBinanceSymbols() {
    const res = await axios.get(`${BASE_URL}/api/v3/exchangeInfo`)
    return res.data.symbols.map(s => s.symbol)
}

export async function fetchTradesForSymbol({ apiKey, secret, symbol }) {
    const timestamp = Date.now();
    const query = `symbol=${symbol}&timestamp=${timestamp}`

    const signature = sign(query, secret)

    const url = `${BASE_URL}/api/v3/myTrades?${query}&signature=${signature}`

    const res = await axios.get(url, {
        headers: {
            "X-MBX-APIKEY": apiKey,
        },
    })
    return res.data
}


export async function discoverUserBinanceTrades({ apiKey, secret }) {
    console.log("Starting progressive discovery sync...")

    let allTrades = []
    let discoveredSymbols = []

    const TOP_SYMBOLS = [
        "BTCUSDT",
        "ETHUSDT",
        "BNBUSDT",
        "SOLUSDT",
        "XRPUSDT",
        "ADAUSDT",
        "DOGEUSDT",
        "AVAXUSDT",
        "MATICUSDT",
        "LINKUSDT",
        "DOTUSDT",
        "LTCUSDT",
        "TRXUSDT",
        "UNIUSDT",
        "ATOMUSDT",
        "ETHBTC",
        "BNBBTC",
        "SOLBTC",
        "LTCBTC",
        "XRPBTC"
    ]

    for (const symbol of TOP_SYMBOLS) {
        try {
            console.log("Checking symbol:", symbol);

            const trades = await fetchTradesForSymbol({
                apiKey,
                secret,
                symbol
            })

            if (trades.length > 0) {
                console.log(`Found ${trades.length} trades for ${symbol}`)
                allTrades.push(...trades)
                discoveredSymbols.push(symbol)
            } else {
                console.log(`No trades for ${symbol}`)
            }

            await new Promise(r => setTimeout(r, 400))
        } catch (err) {
            console.log("Error on symbol", symbol)
        }
    }

    console.log("Discovered finished");
    console.log("Total Trades:", allTrades.length);
    console.log("Active Symbols:", discoveredSymbols)

    return {
        trades: allTrades,
        symbols: discoveredSymbols
    }
}

export async function fetchExchangeSymbolMap() {
    console.log("Fetching Binance exchange symbol metaData...");

    const res = await axios.get(`${BASE_URL}/api/v3/exchangeInfo`);

    const map = {};

    for (const s of res.data.symbols) {
        map[s.symbol] = {
            baseAsset: s.baseAsset,
            quoteAsset: s.quoteAsset,
            status: s.status,
        };
    }

    console.log("Symbol map built. Total Symbols:", Object.keys(map).length);
    return map;
}

export async function placeTestTrade({
    apiKey,
    secret,
    symbol,
    side,
    quantity
}) {
    const timestamp = Date.now();

    const params = new URLSearchParams({
        symbol,
        side,
        type: "MARKET",
        quantity,
        timestamp
    });

    const signature = sign(params.toString(), secret);

    const url = `${BASE_URL}/api/v3/order?${params}&signature=${signature}`;

    const res = await axios.post(url, null, {
        headers: {
            "X-MBX-APIKEY": apiKey
        }
    });

    return res.data;
}