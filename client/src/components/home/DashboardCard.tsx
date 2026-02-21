import type { ReactNode } from "react";

interface DashboardCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  testId: string;
  onClick: () => void;
}

export function DashboardCard({ icon, title, description, testId, onClick }: DashboardCardProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="bg-white/10 hover:bg-white/20 rounded-xl p-4 flex flex-col items-start gap-2 text-left transition-colors cursor-pointer"
    >
      {icon}
      <span className="font-['Aclonica',sans-serif] text-white text-sm md:text-base">
        {title}
      </span>
      <span className="text-white/60 font-['Roboto',Helvetica] text-xs md:text-sm">
        {description}
      </span>
    </button>
  );
}
