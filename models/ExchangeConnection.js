import mongoose from "mongoose";

const ExchangeConnectionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        exchange: {
            type: String,
            required: true,
            index: true,
            enum: ["BINANCE", "COINDCX", "WAZIRX", "COINBASE", "KUCOIN", "KRAKEN", "LUNO", "NEWTON", "COINSPOT", "BYBIT", "CRYPTOCOM", "GEMINI"],
            default: "BINANCE"
        },
        apiKey: {
            type: String,
            required: true,
        },
        encryptedSecret: {
            type: String,
            required: true
        },
        iv: {
            type: String,
            required: true
        },
        // Optional: KuCoin requires a 3rd credential - API Passphrase. Stored encrypted.
        encryptedPassphrase: {
            type: String,
            default: null
        },
        passphraseIv: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ["ACTIVE", "ERROR", "EXPIRED"],
            default: "ACTIVE"
        },
        lastSync: {
            type: Date
        }
    },
    { timestamps: true }
);

// A user can only have one active connection per exchange right now to keep it simple
ExchangeConnectionSchema.index(
    { userId: 1, exchange: 1 },
    { unique: true }
);

export default mongoose.models.ExchangeConnection || mongoose.model("ExchangeConnection", ExchangeConnectionSchema);
