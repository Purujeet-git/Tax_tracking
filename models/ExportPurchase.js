import mongoose from "mongoose";

const ExportPurchaseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        region: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        year: {
            type: Number,
            required: true,
        },
        provider: {
            type: String,
            enum: ["STRIPE", "RAZORPAY"],
            required: true,
        },
        providerSessionId: {
            type: String,
            index: true,
        },
        providerPaymentId: {
            type: String,
            index: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED"],
            default: "PENDING",
            index: true,
        },
        amount: Number,
        currency: String,
        exportKey: {
            type: String,
            required: true,
            index: true,
        },
        paidAt: Date,
    },
    { timestamps: true }
);

ExportPurchaseSchema.index({ userId: 1, region: 1, year: 1, status: 1 });

export default mongoose.models.ExportPurchase || mongoose.model("ExportPurchase", ExportPurchaseSchema);
