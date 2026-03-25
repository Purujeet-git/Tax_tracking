import mongoose from "mongoose";

const DisposalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        asset: {
            type: String,
            required: true,
            index: true,
        },
        sellTransactionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        lotId: {
            type: mongoose.Schema.Types.ObjectId,
            index: true,
            default:null,
        },

        quantitySold: {
            type: Number,
            required: true,
        },

        salePrice: Number,
        proceeds: Number,

        costPerUnit: Number,
        totalCost: Number,

        gainLoss: Number,

        acquiredAt: {
            type: Date,
            required: true
        },
        disposedAt: {
            type: Date,
            required: true,
            index: true
        },

        holdingDays: Number,

        taxCategory: {
            type: String,
            enum: ["SHORT_TERM", "LONG_TERM", "SPECIAL","POOL","SAME_DAY","SECTION_104","BED_AND_BREAKFAST"],
        },

        strategyUsed: {
            type: String,
            default: "FIFO"
        }
    },
    { timestamps: true }
);

DisposalSchema.index(
    { userId: 1, sellTransactionId: 1, lotId: 1 },
    { unique: true }
);

export default mongoose.models.Disposal || mongoose.model("Disposal", DisposalSchema);