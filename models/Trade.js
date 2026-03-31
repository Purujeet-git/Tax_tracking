import mongoose from "mongoose";

const TradeSchema = new mongoose.Schema({
    
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        asset: {
            type: String,
            required: true,
            index: true,
        },
        symbol: {
            type: String,
            default: null,
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ["BUY", "SELL"],
            required: true,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },

        fee: {
            type: Number,
            default: 0,
        },
        feeAsset: {
            type: String,
            default: null,
        },
        source: {
            type: String,
            required: true,
        },
        exchange: {
            type: String,
            default: null,
            index: true,
        },
        raw: {
            type: Object,
            default: null,
        },
        metadata: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

TradeSchema.index(
    { userId: 1,asset:1,date:1,quantity:1,price:1},
    {unique:false}
);

export default mongoose.models.Trade || mongoose.model("Trade",TradeSchema);