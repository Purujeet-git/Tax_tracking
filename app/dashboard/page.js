"use client"

import { useState } from "react"

export default function Dashboard(){
    const [loading, setLoading] = useState(false)

    const syncBinance = async () => {
        setLoading(true)

        await fetch("/api/binance/trades", {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                apiKey:"qlM5QRf7UwgSntqJvc4YiK6us6waYJ3pIfygz5TQjNuYgdyt7WhpjGysWLtqJoxC",
                secret:"PXTm09KlyRYC63iMToLhbdaOh7PTo8vZ8DbraSJ1LzGee7q7hEKhgpDMDggvtT03"
            })
        })

        setLoading(false)
        alert("SYNC Completed")
    }

    return(
        <div>
            <h1>Dashboard</h1>

            <button onClick={syncBinance}>
                {loading?"Syncing...":"Sync Binance"}
            </button>
        </div>
    )
}