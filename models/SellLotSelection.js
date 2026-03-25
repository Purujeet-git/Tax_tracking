import mongoose from "mongoose";

const SellLotSelectionSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        index:true,
        required:true
    },
    sellTransactionId:{
        type:mongoose.Schema.Types.ObjectId,
        index:true,
        required:true,
    },
    lotId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    quantity:{
        type:Number,
        required:true,
    }
},{timestamps:true});

SellLotSelectionSchema.index(
    {userId:1,sellTransactionId:1,lotId:1},
    {unique:true}
);

export default mongoose.models.SellLotSelection || mongoose.model("SellLotSelection",SellLotSelectionSchema);