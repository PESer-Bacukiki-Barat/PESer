import { BottomNav } from "@/components/bottom-nav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col bg-background">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
