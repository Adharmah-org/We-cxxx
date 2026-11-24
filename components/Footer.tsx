import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#2B2823] bg-[#0C0B0A]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-literary text-lg font-medium text-[#EFEAE0]">
            TEJAS · BENIYAAZ.ROOH
          </p>
          <p className="mt-1 text-sm text-[#9A9285]">
            Official literary archive of Tejas Purvesh Phirake (तेजस पुर्वेश फिरके). Some feelings leave. The words stay.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#9A9285]"
        >
          <Link href="/books" className="transition-colors hover:text-[#C9A45C] whitespace-nowrap">
            Library
          </Link>
          <Link href="/poetry" className="transition-colors hover:text-[#C9A45C] whitespace-nowrap">
            Poetry & Songs
          </Link>
          <Link href="/theatre" className="transition-colors hover:text-[#C9A45C] whitespace-nowrap">
            Theatre
          </Link>
          <Link href="/stories" className="transition-colors hover:text-[#C9A45C] whitespace-nowrap">
            Stories
          </Link>
          <Link href="/journal" className="transition-colors hover:text-[#C9A45C] whitespace-nowrap">
            Unsaid Journal
          </Link>
        </nav>
      </div>
    </footer>
  );
}
