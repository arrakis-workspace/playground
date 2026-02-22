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
      className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md p-4 flex flex-col items-start gap-2 text-left transition-shadow cursor-pointer"
    >
      {icon}
      <span className="text-foreground font-semibold text-sm md:text-base">
        {title}
      </span>
      <span className="text-muted-foreground text-xs md:text-sm">
        {description}
      </span>
    </button>
  );
}
