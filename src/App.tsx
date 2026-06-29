import { useState, useCallback } from 'react';
import { Header, type Page } from '@/sections/Header';
import { Dropzone } from '@/sections/Dropzone';
import { DashboardView } from '@/sections/DashboardView';
import { DataTable } from '@/sections/DataTable';
import { FieldPanel } from '@/sections/FieldPanel';
import { ReportPage } from '@/pages/ReportPage';
import { MonitoringPage } from '@/pages/MonitoringPage';
import { EvaluasiPage } from '@/pages/EvaluasiPage';
import { Dashboard2Page } from '@/pages/Dashboard2Page';
import { useExcelParser } from '@/hooks/useExcelParser';
import { useTableData } from '@/hooks/useTableData';
import './App.css';

function App() {
  const { data, isLoading, statusText, error, parseFile, reset } = useExcelParser();
  const [showFieldPanel, setShowFieldPanel] = useState(false);
  const [activePage, setActivePage] = useState<Page>('dashboard');

  const {
    searchQuery,
    setSearchQuery,
    sortConfig,
    toggleSort,
    expandedRow,
    expandRow,
    columnConfigs,
    visibleColumns,
    processedRows,
    toggleColumnVisibility,
    exportToExcel,
  } = useTableData(data);

  const handleFileSelect = useCallback((file: File) => {
    parseFile(file);
    setActivePage('dashboard');
  }, [parseFile]);

  const handleReset = useCallback(() => {
    reset();
    setShowFieldPanel(false);
    setActivePage('dashboard');
  }, [reset]);

  const renderPage = () => {
    if (!data) return null;

    switch (activePage) {
      case 'dashboard2':
        return (
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="w-full max-w-[1800px] mx-auto">
              <Dashboard2Page data={data} />
            </div>
          </div>
        );
      case 'report':
        return (
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="w-full max-w-[1600px] mx-auto">
              <ReportPage data={data} onExport={exportToExcel} fileName={data.fileName} />
            </div>
          </div>
        );
      case 'monitoring':
        return (
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="w-full max-w-[1600px] mx-auto">
              <MonitoringPage data={data} />
            </div>
          </div>
        );
      case 'evaluasi':
        return (
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="w-full max-w-[1600px] mx-auto">
              <EvaluasiPage data={data} />
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-background">
            <div className="w-full max-w-[1600px] mx-auto flex flex-col flex-1 min-h-0">
              <DashboardView data={data} />

              <div className="flex flex-1 min-h-[500px] overflow-hidden px-6 pb-6 pt-2">
                <div className="flex flex-1 min-h-0 overflow-hidden bg-white rounded-2xl border border-border premium-shadow shadow-sm">
                  <DataTable
                    data={data}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sortConfig={sortConfig}
                    onSort={toggleSort}
                    expandedRow={expandedRow}
                    onExpandRow={expandRow}
                    visibleColumns={visibleColumns}
                    processedRows={processedRows}
                    onTogglePanel={() => setShowFieldPanel(prev => !prev)}
                    onExport={exportToExcel}
                    fileName={data.fileName}
                  />

                  {showFieldPanel && (
                    <div className="w-[280px] flex-shrink-0 h-full border-l border-border bg-white">
                      <FieldPanel
                        columns={columnConfigs}
                        onToggleColumn={toggleColumnVisibility}
                        onClose={() => setShowFieldPanel(false)}
                        hiddenCount={columnConfigs.filter(c => !c.visible).length}
                        totalCount={columnConfigs.length}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-orange-50 via-rose-50 to-white overflow-hidden">
      <Header
        onReset={handleReset}
        hasData={!!data}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      {!data ? (
        <Dropzone
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          statusText={statusText}
          error={error}
        />
      ) : renderPage()}
    </div>
  );
}

export default App;
