"use client"

import { signIn, signOut, useSession } from "next-auth/react"

export default function LoginPage() {
    const { data: session } = useSession()

    if (session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f4f4f0] p-4">
                <div className="w-full max-w-md border-2 border-black bg-white p-12 rounded-lg shadow-[12px_12px_0_#000] text-center">
                    <p className="inline-flex rounded-full border-2 border-black bg-[#9dff7a] px-3 py-1 text-[10px] font-black uppercase mb-4">
                        Active Session
                    </p>
                    <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4">
                        WELCOME BACK, <br />
                        <span className="text-zinc-600">{session.user.name.split(' ')[0]}</span>
                    </h1>
                    <p className="text-zinc-500 font-semibold mb-8 uppercase tracking-wide text-xs">
                        TERMINAL IS READY FOR INPUT
                    </p>
                    <button 
                        onClick={() => signOut()}
                        className="w-full h-14 rounded-full border-2 border-black bg-white text-black font-black uppercase tracking-widest hover:bg-[#ff5c5c] hover:text-white transition-all cursor-pointer"
                    >
                        Sign Out
                    </button>
                    <div className="mt-8">
                        <a href="/dashboard" className="text-sm font-black uppercase underline decoration-2 underline-offset-4 hover:text-[#35c96e]">
                            Go to Dashboard →
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f4f4f0] p-4">
            <div className="w-full max-w-md border-2 border-black bg-white p-12 rounded-lg shadow-[12px_12px_0_#000]">
                <div className="mb-0">
                    <p className="inline-flex rounded-full border-2 border-black bg-[#9dff7a] px-3 py-1 text-[10px] font-black uppercase mb-6">
                        Trader OS v1.0
                    </p>
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
                        TAKE <br />
                        CONTROL.
                    </h1>
                    <p className="text-zinc-600 font-bold mb-10 uppercase tracking-tight text-sm leading-tight">
                        Every exchange in one <br />clean portfolio ledger.
                    </p>
                </div>

                <button 
                    onClick={() => signIn("google")}
                    className="w-full h-16 rounded-full bg-black text-white font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Login with Google</span>
                </button>

                <div className="mt-8 pt-8 border-t border-zinc-100">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center">
                        Secure terminal access • Zero latency data
                    </p>
                </div>
            </div>
        </div>
    )
}