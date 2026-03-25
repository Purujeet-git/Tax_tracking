"use client"

import { signIn,signOut,useSession } from "next-auth/react"

export default function LoginPage(){
    const {data:session} = useSession()

    if(session){
        return(
            <div>
                <h2>Welcome {session.user.name}</h2>
                <button onClick={() => signOut()}>Logout</button>
            </div>
        )
    }

    return (
        <div>
            <button onClick={() => signIn("google")}>
                Login with google
            </button>
        </div>
    )
}