"use client"

export default function TaxToolsPage(){

   const generateLots = async () => {
      const res = await fetch("/api/tax/generate-lots", {
         method: "POST"
      })

      const data = await res.json()
      console.log(data)
      alert(JSON.stringify(data))
   }

   const runFifo = async () => {
      const res = await fetch("/api/tax/run-fifo", {
         method: "POST"
      })

      const data = await res.json()
      console.log(data)
      alert(JSON.stringify(data))
   }

   return (
      <div style={{padding:40}}>
         <h1>Tax Engine Tools</h1>

         <button onClick={generateLots}>
            Generate Lots
         </button>

         <br/><br/>

         <button onClick={runFifo}>
            Run FIFO Matching
         </button>
      </div>
   )
}