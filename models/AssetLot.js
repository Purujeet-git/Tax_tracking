import mongoose from "mongoose";

const AssetLotSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            index:true,
        },
        asset:{
            type:String,
            required:true,
            index:true,
        },
        exchange:{
            type:String,
            index:true,
        },
        sourceTransactionId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            index:true,
        },
        acquiredAt:{
            type:Date,
            required:true,
            index:true,
        },
        totalQuantity:{
            type:Number,
            required:true,
        },
        remainingQuantity:{
            type:Number,
            required:true,
        },
        costPerUnit:{
            type:Number,
            required:true,
        },
        totalCost:{
            type:Number,
            required:true,
        },
        feelIncluded:{
            type:Boolean,
            default:true,
        },
    },
    {timestamps:true}
);

AssetLotSchema.index(
    {userId:1,sourceTransactionId:1},
    {unique:true}
);

export default mongoose.models.AssetLot || mongoose.model("AssetLot",AssetLotSchema);