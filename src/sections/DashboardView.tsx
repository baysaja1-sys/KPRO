import { SummaryCards } from '@/sections/SummaryCards';
import { StatusPieChart } from '@/components/StatusPieChart';
import { CategoryBarChart } from '@/components/CategoryBarChart';
import type { ExcelData } from '@/types';

interface DashboardViewProps {
  data: ExcelData;
}

export function DashboardView({ data }: DashboardViewProps) {
  return (
    <div className="flex flex-col gap-4 p-6 pb-2">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">High-level insights from your fulfillment report.</p>
      </div>
      
      <div className="-mx-6">
        <SummaryCards data={data} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass premium-shadow rounded-2xl p-5 md:col-span-1 flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-bold text-foreground mb-1">Status Overview</h2>
            <p className="text-xs text-muted-foreground">Distribution of tasks by status</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            <StatusPieChart data={data} />
          </div>
        </div>
        
        <div className="glass premium-shadow rounded-2xl p-5 md:col-span-2 flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-bold text-foreground mb-1">Categorical Breakdown</h2>
            <p className="text-xs text-muted-foreground">Top items distribution</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            <CategoryBarChart data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
