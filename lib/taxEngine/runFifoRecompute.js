import { resetLotsForUser } from "./resetLots";
import { clearDisposalsForUser } from "./resetDisposals";
import { runFifoMatching } from "./fifoMatcher";

export async function runFifoFullRecompute(userId) {
  console.log("Starting FULL FIFO recompute...");

  await clearDisposalsForUser(userId);

  await resetLotsForUser(userId);

  const count = await runFifoMatching(userId);

  console.log("FIFO recompute finished");

  return count;
}