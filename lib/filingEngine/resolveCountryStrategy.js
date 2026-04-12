export function resolveCountryStrategy({
    country,
    disposal,
}) {
    if (country === "INDIA") {
        return {
            method: disposal.strategyUsed || "FIFO",
            lotSelection: null,
        };
    }

    if (country === "UK") {
        return {
            method: "HMRC_MATCHING",
            lotSelection:
                disposal.taxCategory || "SECTION_104",
        };
    }

    if (country === "CANADA") {
        return {
            method: "ACB",
            lotSelection: null,
        };
    }

    if (country === "USA") {
        const strategy =
            disposal.strategyUsed || "FIFO";

        if (["HIFO", "LIFO"].includes(strategy)) {
            return {
                method: "SPECIFIC_ID",
                lotSelection: strategy,
            };
        }

        return {
            method: strategy,
            lotSelection: null,
        };
    }

    if (country === "AUSTRALIA") {
        return {
            method: disposal.strategyUsed || "FIFO",
            lotSelection: null,
        };
    }

    return {
        method: disposal.strategyUsed || "FIFO",
        lotSelection: null,
    };
}