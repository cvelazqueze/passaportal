import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, description, icon, className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="flex items-center justify-between pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
