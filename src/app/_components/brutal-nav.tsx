"use client";

export function BrutalNav() {
  return (
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between p-12">
      <div className="text-4xl font-black tracking-tighter text-foreground uppercase italic">
        AF//NEUTRAL
      </div>
      <button
        onClick={() => document.documentElement.classList.toggle("dark")}
        className="border-2 border-border px-12 py-3 text-xs font-black uppercase shadow-[8px_8px_0px_currentColor] transition-all hover:bg-foreground hover:text-background"
      >
        OVERRIDE
      </button>
    </nav>
  );
}
