import Navbar from "@/components/Navbar";
import "./globals.css";
import Providers from "./providers";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
    weight:['400'],
    subsets:['latin'],
    variable:"--font-jakarta",
});


export const metadata = {
  title: "Trader OS | Crypto Tax Control Center",
  description: "Track crypto trades, compare tax strategies, and prepare filing exports from one portfolio ledger.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
    >
      
      <body className="min-h-full flex flex-col">
        
        <Providers>
          <Navbar/>
          {children}</Providers>
        </body>
    </html>
  );
}
