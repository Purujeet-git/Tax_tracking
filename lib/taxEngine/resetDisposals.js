import Disposal from "@/models/Disposal";

export async function clearDisposalsForUser(userId) {
  console.log("Clearing old disposals...");

  await Disposal.deleteMany({ userId });

  console.log("Disposals cleared");
}