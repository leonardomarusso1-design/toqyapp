export function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl ${className}`}>
      <div className="h-full overflow-y-auto bg-ink">{children}</div>
    </div>
  );
}
