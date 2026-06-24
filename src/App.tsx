import { useState, useCallback } from 'react';
import { Header } from '@/sections/Header';
import { Dropzone } from '@/sections/Dropzone';

import { DashboardView } from '@/sections/DashboardView';
import { DataTable } from '@/sections/DataTable';
import { FieldPanel } from '@/sections/FieldPanel';
import { useExcelParser } from '@/hooks/useExcelParser';
import { useTableData } from '@/hooks/useTableData';
import './App.css';

function App() {
  const { data, isLoading, error, parseFile, reset } = useExcelParser();
  const [showFieldPanel, setShowFieldPanel] = useState(false);

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
    exportToCSV,
  } = useTableData(data);

  const handleFileSelect = useCallback((file: File) => {
    parseFile(file);
  }, [parseFile]);

  const handleReset = useCallback(() => {
    reset();
    setShowFieldPanel(false);
  }, [reset]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F5F5F5] overflow-hidden">
      <Header onReset={handleReset} hasData={!!data} />

      {!data ? (
        <Dropzone
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          error={error}
        />
      ) : (
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
                  onExport={exportToCSV}
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
      )}
    </div>
  );
}

export default App;
