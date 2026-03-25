import { runMatchingEngine } from "./matchingEngine";
import { generateLotsForUser } from "./generateLots";
import Disposal from "@/models/Disposal";
import AssetLot from "@/models/AssetLot";

export async function recomputeLedger({
    userId,
    strategy = "FIFO"
}) {
    console.log("Starting full ledger recompute");
    console.log("Strategy:",strategy);

    const deletedDisposals = await Disposal.deleteMany({userId});
    console.log("Deleted Disposals:",deletedDisposals.deletedCount);

    const deletedLots = await AssetLot.deleteMany({userId});
    console.log("Delete lots:",deletedLots.deletedCount);

    const lotsCreated = await generateLotsForUser(userId);
    console.log("Lots rebuilt:",lotsCreated);

    const disposalsCreated = await runMatchingEngine({
        userId,
        strategy
    });



    console.log("Disposal created:",disposalsCreated);


    return {
        lotsCreated,
        disposalsCreated
    };
}