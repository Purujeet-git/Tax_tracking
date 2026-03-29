import { getLossHarvsetingOpportunities } from "./lossHarvesting";
import { simulateSell } from "../simulator/simulateSell";

export async function buildHarvestPlan(userId) {
    console.log("Building Harvest Plan...");

    const opportunities = await getLossHarvsetingOpportunities(userId);

    if(!opportunities.length){
        return {
            message:"No harvesting opportunities available",
            plan:[]
        };
    }

    const plan = [];

    let totalEstimatedSavings = 0;
    let totalSimulatedGain = 0;

    const topLots = opportunities.slice(0,5);

    for(const lot of topLots){
        const simulation = await simulateSell({
            userId,
            asset:lot.asset,
            quantity: lot.quantity,
            strategy:"HIFO"
        });

        totalEstimatedSavings += lot.estimatedTaxSaving;
        totalSimulatedGain += simulation.totalGain;

        plan.push({
            asset:lot.asset,
            lotId:lot.lotId,
            quantity: lot.quantity,

            estimatedTaxSaving: lot.estimatedTaxSaving,
            simulatedGain: simulation.totalGain
        });
    }

    return {
        totalEstimatedSavings: Number(totalEstimatedSavings.toFixed(8)),
        totalSimulatedGain: Number(totalSimulatedGain.toFixed(8)),
        plan
    };
}