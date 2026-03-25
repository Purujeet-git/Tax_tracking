import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google"
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const authOptions ={
    providers:[
        GoogleProvider({
            clientId:process.env.GOOGLE_CLIENT_ID,
            clientSecret:process.env.GOOGLE_CLIENT_SECRET
        })
    ],

    session:{
        strategy:"jwt"
    },

    callbacks:{
        async signIn({user}) {
            await connectDB()

            const existingUser = await User.findOne({email:user.email})

            if(!existingUser){
                await User.create({
                    email:user.email,
                    name:user.name,
                    image:user.image
                })
            }

            return true
        },

        async session({session,token}){
            await connectDB();

            const dbUser = await User.findOne({email:session.user.email})

            session.user.id = dbUser._id.toString()

            return session
        }
    },

    secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)

export {handler as GET, handler as POST}