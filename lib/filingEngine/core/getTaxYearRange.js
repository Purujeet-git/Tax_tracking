export function getTaxYearRange({
    country="INDIA",
    year
}) {
    switch(country){
        case "INDIA":{
            const start = new Date(year,3,1);
            const end = new Date(
                year+1,
                2,
                31,
                23,
                59,
                59
            );

            return {
                label: `FY ${year}-${(
                    year + 1
                )
                    .toString()
                    .slice(2)}`,
                start,
                end
            };
        }

        case "UK":{
            const start = new Date(year,3,6);
            const end = new Date(
                year+1,
                3,
                5,
                23,
                59,
                59
            );

            return {
                label:`${year}-${(
                    year + 1
                )
                    .toString()
                    .slice(2)}`,
                start,
                end
            };
        }

        case "USA":
        case "CANADA":{
            const start = new Date(year,0,1);
            const end = new Date(
                year,
                11,
                31,
                23,
                59,
                59
            );

            return {
                label:`${year}`,
                start,
                end
            };
        }

        case "AUSTRALIA":{
            const start = new Date(year,6,1);
            const end = new Date(
                year + 1,
                5,
                30,
                23,
                59,
                59
            );

            return {
                label: `FY ${year} - ${(
                    year + 1
                )
                    .toString()
                    .slice(2)}`,
                start,
                end
            };
        }

        default:
            throw new Error(
                `Unsupported country: ${country}`
            );
    }
}