import { LayoutDashboard, FileBarChart2, Activity, ClipboardCheck, RotateCcw, ChevronRight } from 'lucide-react';

export type Page = 'dashboard' | 'report' | 'monitoring' | 'evaluasi';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'report', label: 'Report', icon: FileBarChart2 },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'evaluasi', label: 'Evaluasi', icon: ClipboardCheck },
];

export function Header({ onReset, hasData, activePage, onNavigate }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-[60px] px-5 bg-white border-b border-orange-100 flex-shrink-0 z-20 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-red-400 to-rose-500 shadow-md shadow-orange-200">
          <LayoutDashboard className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-extrabold tracking-tight leading-none bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            KPRO
          </h1>
          <p className="text-[10px] text-orange-400 font-medium leading-none mt-0.5">Dashboard Analytics</p>
        </div>
      </div>

      {/* Nav Menu */}
      {hasData && (
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200'
                    : 'text-orange-700/70 hover:bg-orange-50 hover:text-orange-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 opacity-70" />}
              </button>
            );
          })}
        </nav>
      )}

      {/* Actions */}
      {hasData && (
        <button
          onClick={onReset}
          id="btn-new-file"
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-lg text-orange-600 border border-orange-200 hover:bg-orange-50 transition-colors duration-150"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New File
        </button>
      )}
    </header>
  );
}
