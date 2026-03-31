export function formatHarvestPlan(plan, mode = "simple") {
    if (!plan || !plan.actions || plan.actions.length === 0) {
        return "✅ No tax-saving opportunities found.";
    }

    const formatCurrency = (num) =>
        `₹${(num || 0).toLocaleString("en-IN")}`;
    const formatQuantity = (num) => Number(num.toFixed(4));
    if (mode === "simple") {
        let output = "💡 Tax Saving Plan\n\nSell:\n";

        plan.actions.forEach((a) => {
            output += `• ${formatQuantity(a.quantity)} ${a.asset} → Save ${formatCurrency(a.taxSaved)}\n`;
        });

        output += `\n💰 Total Tax Saved: ${formatCurrency(plan.summary.totalTaxSaved)}`;

        return output;
    }

    let output = "🔍 Detailed Tax Plan\n\n";

    plan.actions.forEach((a) => {
        output += `📊 ${a.asset}\n`;
        output += `- Sell Quantity: ${a.quantity}\n`;
        output += `- Current Loss: ${formatCurrency(a.loss)}\n`;
        output += `- Tax Saved: ${formatCurrency(a.taxSaved)}\n`;
        output += `- Reason: ${a.reason}\n\n`;
    });

    output += `💰 Total Tax Saved: ${formatCurrency(plan.summary.totalTaxSaved)}`;

    return output;
}