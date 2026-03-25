import { runFifoStrategy } from "./strategies/fifoStrategy";
import { runHifoStrategy } from "./strategies/hifoStrategy";
import { runLifoStrategy } from "./strategies/lifoStrategy";
import { runSpecificIdStrategy } from "./strategies/specificIdStrategy";
import { runAcbStrategy } from "./strategies/acbStrategy";
import { runUkStrategy } from "./strategies/ukStrategy";

export async function runMatchingEngine({
    userId,
    strategy,
    sellId = null
}) {
    console.log("Running tax matching engine:", strategy);

    switch (strategy) {
        case "FIFO":
            return await runFifoStrategy(userId, sellId);
        case "HIFO":
            return await runHifoStrategy(userId, sellId);
        case "LIFO":
            return await runLifoStrategy(userId, sellId);
        case "SPECIFIC_ID":
            return await runSpecificIdStrategy(userId, sellId);
        case "ACB":
            return await runAcbStrategy(userId);
        case "UK":
            return await runUkStrategy(userId);
        default:
            throw new Error("Unsupported tax strategy:" + strategy);
    }
}