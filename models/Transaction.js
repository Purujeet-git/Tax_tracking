import mongoose, { mongo } from "mongoose";

const TransactionSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            index:true
        },
        exchange:{
            type:String,
            required:true,
            index:true,
        },
        symbol:{
            type:String,
            index:true,
        },
        baseAsset:String,
        quoteAsset:String,
        side:{
            type:String,
            enum:["BUY","SELL"]
        },
        quantity:Number,
        price:Number,

        feeAmount:Number,
        feeAsset:String,
        type:{
            type:String,
            enum:["TRADE","DEPOSIT","WITHDRAWL","TRANSFER","SWAP"],
            default:"TRADE",
        },
        unitFiatPrice:{
            type:Number,
            index:true,
        },
        fiatValue:{
            type:Number,
            index:true,
        },
        fiatCurrency:{
            type:String,
            index:true,
        },
        fxRateUsed:{
            type:Number,
        },
        valuationSource:{
            type:String,
        },
        totalValue:Number,
        costBasis:Number,
        matchedBuyId:mongoose.Schema.Types.ObjectId,
        gainLoss:Number,
        holdingPeriodDays:Number,
        taxCategory:{
            type:String,
            enum:["SHORT_TERM","LONG_TERM"],
        },
        tradeId:{
            type:String,
            index:true
        },
        orderId:String,
        timestamp:{
            type:Date,
            index:true,
        },
        raw:Object
    },

    {timestamps:true}
)

TransactionSchema.index(
    {exchange:1,tradeId:1,userId:1},
    {unique:true}
)

export default mongoose.models.Transaction || mongoose.model("Transaction",TransactionSchema);

