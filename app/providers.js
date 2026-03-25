"use client"
import {SessionProvider, sessionProvider} from "next-auth/react"

export default function Providers({children}) {
    return <SessionProvider>{children}</SessionProvider>
}