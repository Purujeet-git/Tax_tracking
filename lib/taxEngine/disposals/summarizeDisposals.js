export function summarizeDisposals(disposals = []){
    let totalGain = 0;

    for(const d of disposals){
        totalGain += d.gain;
    }

    return {
        disposalCount:disposals.length,
        totalGain,
    };
}