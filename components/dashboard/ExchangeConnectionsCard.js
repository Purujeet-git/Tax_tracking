"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { RefreshCcw, KeyRound, CheckCircle2 } from "lucide-react";

export default function ExchangeConnectionsCard() {
    const [connections, setConnections] = useState([]);
    const [exchange, setExchange] = useState("BINANCE");
    const [apiKey, setApiKey] = useState("");
    const [secret, setSecret] = useState("");
    const [passphrase, setPassphrase] = useState("");
    const [loading, setLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(null);

    // KuCoin requires a 3rd field — detect it dynamically
    const needsPassphrase = exchange === "KUCOIN";

    const fetchConnections = async () => {
        const res = await fetch("/api/exchange-connection");
        const json = await res.json();
        if (json.success) {
            setConnections(json.connections);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadConnections = async () => {
            const res = await fetch("/api/exchange-connection");
            const json = await res.json();

            if (!cancelled && json.success) {
                setConnections(json.connections);
            }
        };

        loadConnections();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSaveConnection = async () => {
        if (!apiKey || !secret) return alert("Keys are required to connect an exchange securely.");
        if (needsPassphrase && !passphrase) return alert("KuCoin requires an API Passphrase as well as the Key and Secret.");

        setLoading(true);
        try {
            const body = { exchange, apiKey, secret };
            if (passphrase) body.passphrase = passphrase;

            const res = await fetch("/api/exchange-connection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const result = await res.json();

            if (result.success) {
                setApiKey("");
                setSecret("");
                setPassphrase("");
                await fetchConnections();
            } else {
                alert(result.error);
            }
        } catch (err) {
            alert("Failed to connect exchange");
        }
        setLoading(false);
    };

    const syncExchange = async (exchangeName) => {
        setSyncLoading(exchangeName);
        try {
            // Trigger backend sync which decrypts credentials securely
            const res = await fetch("/api/sync/exchange", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exchange: exchangeName })
            });

            const result = await res.json();
            if (result.success) {
                alert(`Successfully Synced! Pulled ${result.inserted} new trades from ${exchangeName}.`);
                fetchConnections();
            } else {
                alert(`Sync Error: ${result.error}`);
            }
        } catch (e) {
            alert("Failed to sync automatically.");
        }
        setSyncLoading(null);
    };

    const deleteConnection = async (exchangeName) => {
        if (!confirm(`Are you sure you want to disconnect ${exchangeName}? The API Key will be permanently deleted from the vault.`)) return;
        
        try {
            const res = await fetch(`/api/exchange-connection?exchange=${exchangeName}`, {
                method: "DELETE"
            });
            const result = await res.json();
            
            if (result.success) {
                await fetchConnections();
            } else {
                alert(`Error disconnecting: ${result.error}`);
            }
        } catch (err) {
            alert("Failed to disconnect exchange.");
        }
    };

    return (
        <Card className="h-full max-h-[560px] rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
            <CardContent className="h-full p-6">
                <div className="grid h-full min-h-0 gap-6 md:grid-cols-2">
                    
                    {/* Add Connection Form */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tighter">
                                <KeyRound className="w-5 h-5" />
                                Secure Exchange Vault
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-zinc-600">Connect your portfolio. Keys are encrypted and never exposed.</p>
                        </div>
                        
                        <div className="space-y-3 rounded-md border-2 border-black bg-[#f4f4f0] p-4">
                            <Select value={exchange} onValueChange={setExchange}>
                                <SelectTrigger className="border-2 border-black bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 font-bold">🇺🇸 United States</SelectLabel>
                                        <SelectItem value="COINBASE">Coinbase</SelectItem>
                                        <SelectItem value="KRAKEN">Kraken</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 font-bold">🇮🇳 India</SelectLabel>
                                        <SelectItem value="COINDCX">CoinDCX</SelectItem>
                                        <SelectItem value="WAZIRX">WazirX</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 font-bold">🇬🇧 United Kingdom</SelectLabel>
                                        <SelectItem value="LUNO">Luno</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 font-bold">🇨🇦 Canada</SelectLabel>
                                        <SelectItem value="NEWTON">Newton</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 font-bold">🇦🇺 Australia</SelectLabel>
                                        <SelectItem value="COINSPOT">CoinSpot</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-zinc-500 font-bold">🌐 Global</SelectLabel>
                                        <SelectItem value="BINANCE">Binance</SelectItem>
                                        <SelectItem value="KUCOIN">KuCoin</SelectItem>
                                        <SelectItem value="BYBIT">Bybit</SelectItem>
                                        <SelectItem value="CRYPTOCOM">Crypto.com</SelectItem>
                                        <SelectItem value="GEMINI">Gemini</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <Input 
                                placeholder="API Key" 
                                value={apiKey} 
                                onChange={e => setApiKey(e.target.value)}
                                className="border-2 border-black bg-white font-mono text-sm"
                            />
                            
                            <Input 
                                placeholder="API Secret" 
                                type="password"
                                value={secret} 
                                onChange={e => setSecret(e.target.value)}
                                className="border-2 border-black bg-white font-mono text-sm"
                            />

                            {/* KuCoin-only: Passphrase field */}
                            {needsPassphrase && (
                                <Input
                                    placeholder="API Passphrase (KuCoin only)"
                                    type="password"
                                    value={passphrase}
                                    onChange={e => setPassphrase(e.target.value)}
                                    className="border-2 border-black bg-white font-mono text-sm"
                                />
                            )}

                            <Button 
                                onClick={handleSaveConnection} 
                                disabled={loading || !apiKey || !secret} 
                                className="h-11 w-full rounded-full bg-black font-black uppercase text-white hover:bg-zinc-800"
                            >
                                {loading ? "Securing Keys..." : "Connect Exchange"}
                            </Button>
                        </div>
                    </div>

                    {/* Active Connections */}
                    <div className="flex min-h-0 flex-col space-y-4">
                        <h2 className="mt-2 text-xs font-black uppercase text-zinc-500">Active integrations</h2>
                        
                        {connections.length === 0 ? (
                            <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border-2 border-dashed border-black bg-[#f4f4f0] text-sm font-semibold text-zinc-500">
                                No active connections.
                            </div>
                        ) : (
                            <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                                {connections.map(conn => (
                                    <div key={conn.exchange} className="flex items-center justify-between gap-3 rounded-md border-2 border-black bg-[#f4f4f0] p-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
                                                <p className="font-black">{conn.exchange}</p>
                                            </div>
                                            <p className="text-xs text-zinc-500 font-mono mt-1">
                                                {conn.apiKey.substring(0, 8)}...{conn.apiKey.substring(conn.apiKey.length - 4)}
                                            </p>
                                            <p className="text-xs text-zinc-400 mt-2">
                                                Synced: {conn.lastSync ? new Date(conn.lastSync).toLocaleString() : "Never"}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm"
                                                disabled={syncLoading === conn.exchange}
                                                onClick={() => syncExchange(conn.exchange)}
                                                className="rounded-full border-2 border-black bg-white font-black text-black hover:bg-[#ffdf5d]"
                                            >
                                                <RefreshCcw className={`w-4 h-4 mr-2 ${syncLoading === conn.exchange ? 'animate-spin' : ''}`} />
                                                {syncLoading === conn.exchange ? "Pulling..." : "Sync"}
                                            </Button>
                                            <Button 
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => deleteConnection(conn.exchange)}
                                                className="rounded-full border-2 border-black bg-white px-3 font-black text-[#dc2626] hover:bg-[#ff5c5c] hover:text-black"
                                                title={`Disconnect ${conn.exchange}`}
                                            >
                                                Disconnect
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
