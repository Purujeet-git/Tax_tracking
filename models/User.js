import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        email:{
            type:String,
            unique:true,
            required:true,
            index:true,
        },

        name:String,
        image:String,
        exchanges:[
            {
                name:String,
                apiKey:String,
                apiSecret:String,
                createdAt:Date
            }
        ]
    },
    {timestamps:true}
)

export default mongoose.models.User || mongoose.model("User",UserSchema)