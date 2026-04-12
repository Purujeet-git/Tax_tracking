import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { parse } from "csv-parse/sync";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { recomputeLedger } from "@/lib/taxEngine/recomputeLedger";

function detectFormat(headers) {
  if (headers.includes("symbol") && headers.includes("side")) {
    return "binance";
  }

  if (headers.includes("tradingsymbol")) {
    return "zerodha";
  }

  return "unknown";
}

function parseBinance(records) {
  return records.map((r) => ({
    exchange: "BINANCE",
    assetClass: "CRYPTO",
    symbol: r.symbol,
    baseAsset: r.symbol.replace("USDT", ""),
    quoteAsset: "USDT",
    side: r.side?.toUpperCase(),
    quantity: Number(r.quantity),
    price: Number(r.price),

    feeAmount: Number(r.fee || 0),
    feeAsset: r.feeAsset || "USDT",

    unitFiatPrice: Number(r.price),
    fiatValue: Number(r.quantity) * Number(r.price),
    fiatCurrency: "USD",

    timestamp: new Date(r.date),
    tradeId: r.tradeId || `${r.symbol}-${r.date}-${r.quantity}`,
    type: "TRADE",
    raw: r
  }));
}

function parseZerodha(records) {
  return records.map((r) => ({
    exchange: "ZERODHA",
    assetClass: "STOCK",
    symbol: r.tradingsymbol,
    baseAsset: r.tradingsymbol,
    quoteAsset: "INR",
    side: r.transaction_type?.toUpperCase(),
    quantity: Number(r.quantity),
    price: Number(r.price),

    feeAmount: Number(r.charges || 0),
    feeAsset: "INR",

    unitFiatPrice: Number(r.price),
    fiatValue: Number(r.quantity) * Number(r.price),
    fiatCurrency: "INR",

    timestamp: new Date(r.order_timestamp),
    tradeId:
      r.order_id ||
      `${r.tradingsymbol}-${r.order_timestamp}-${r.quantity}`,
    type: "TRADE",
    raw: r
  }));
}

export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const contentType = req.headers.get("content-type");

    let transactionsToInsert = [];
    let format = "custom";

    if (contentType?.includes("application/json")) {
      const { transactions } = await req.json();
      if (!transactions || !Array.isArray(transactions)) {
        return NextResponse.json(
          { error: "Invalid transactions array" },
          { status: 400 }
        );
      }
      transactionsToInsert = transactions.map(tx => ({
          ...tx,
          userId,
          timestamp: new Date(tx.timestamp)
      }));
    } else {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 }
        );
      }

      const text = await file.text();

      const records = parse(text, {
        columns: true,
        skip_empty_lines: true
      });

      if (!records.length) {
        return NextResponse.json(
          { error: "CSV is empty" },
          { status: 400 }
        );
      }

      const headers = Object.keys(records[0]);
      format = detectFormat(headers);

      let normalizedTransactions = [];

      if (format === "binance") {
        normalizedTransactions = parseBinance(records);
      } else if (format === "zerodha") {
        normalizedTransactions = parseZerodha(records);
      } else {
        return NextResponse.json(
          { error: "Unsupported CSV format. Use Universal Mapper instead." },
          { status: 400 }
        );
      }

      transactionsToInsert = normalizedTransactions.map((tx) => ({
        ...tx,
        userId
      }));
    }

    if (transactionsToInsert.length) {
        // Use bulkWrite for performance and ignoring duplicates
        const ops = transactionsToInsert.map(tx => ({
            updateOne: {
                filter: { 
                    userId, 
                    tradeId: tx.tradeId || `${tx.symbol || tx.baseAsset}-${tx.timestamp?.getTime()}-${tx.quantity}` 
                },
                update: { $set: tx },
                upsert: true
            }
        }));

        await Transaction.bulkWrite(ops, { ordered: false });

        await recomputeLedger({
            userId,
            strategy: "FIFO"
        });
    }

    return NextResponse.json({
      success: true,
      count: transactionsToInsert.length,
      exchange: format
    });
  } catch (err) {
    console.error("CSV Upload Error:", err);

    return NextResponse.json(
      { error: "Failed to process CSV. Check data formats." },
      { status: 500 }
    );
  }
}