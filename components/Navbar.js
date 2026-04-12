import Image from "next/image";
import Link from "next/link";

const navItems = [
  { name: "Tax", href: "/dashboard/filing-center" },
  { name: "Tracking", href: "/dashboard" },
  { name: "Tools", href: "/dashboard/tax-tools" },
  { name: "Upload", href: "/csv/mapper" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/Logo4.png" height={42} width={42} alt="Trader OS" className="rounded-md" />
          <span className="text-2xl font-black tracking-tighter">Trader OS.</span>
        </Link>

        <div className="hidden items-center rounded-full border-2 border-black bg-[#f4f4f0] p-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="rounded-full px-5 py-2 text-sm font-black uppercase text-black transition hover:bg-black hover:text-white"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <Link
          href="/login"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-black px-5 text-sm font-black uppercase text-white transition hover:bg-zinc-800"
        >
          Login
        </Link>
      </nav>
    </header>
  );
}
