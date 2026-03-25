import AssetLot from "@/models/AssetLot";

export async function resetLotsForUser(userId) {
  console.log("Resetting lots inventory...");

  const lots = await AssetLot.find({ userId });

  for (const lot of lots) {
    lot.remainingQuantity = lot.totalQuantity;
    await lot.save();
  }

  console.log("Lots reset complete");
}