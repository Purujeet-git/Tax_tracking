export function aggregateActions(actions = []){
    if(!actions.length) return [];

    const map = {};

    actions.forEach((a) => {
        if(!map[a.asset]) {
            map[a.asset] = {
                asset: a.asset,
                quantity: 0,
                taxSaved: 0,
                loss: 0,
                reason: "Aggregated loss harvesting"
            };
        }

        map[a.asset].quantity += a.quantity || 0;
        map[a.asset].taxSaved += a.taxSaved || 0;
        map[a.asset].loss += a.loss || 0;
    });

    return Object.values(map);
}