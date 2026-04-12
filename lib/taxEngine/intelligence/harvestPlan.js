import { getLossHarvsetingOpportunities } from "./lossHarvesting";
import { aggregateActions } from "./aggregateActions";

export async function buildHarvestPlan(userId, country = "INDIA") {
    console.log("Building Harvest Plan...");

    const opportunities = await getLossHarvsetingOpportunities(userId, country) || [];
    let totalTaxSaved = 0;

    const rawActions = opportunities.map((op) => {
        const taxSaved = op.estimatedTaxSaving || 0;
        return {
            asset: op.asset,
            quantity: op.quantity,
            taxSaved,
            loss: op.totalLoss || 0,
            reason: "Loss harvesting opportunity",
            warning: op.warning || null, // Forward Section 115BBH warning to UI
        };
    });

    const actions = aggregateActions(rawActions);

    totalTaxSaved = actions.reduce((sum,a) => sum + a.taxSaved, 0);

    return {
        summary: {
            totalTaxSaved,
            actionCount: actions.length,
        },
        actions,
    };
}
