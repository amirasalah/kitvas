'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/app/providers'

export function AdminExportPage() {
  const [exportFilter, setExportFilter] = useState<'labeled' | 'all'>('labeled')
  const [trainRatio, setTrainRatio] = useState(0.7)
  const [validationRatio, setValidationRatio] = useState(0.15)
  const [seed, setSeed] = useState(42)

  const statsQuery = trpc.admin.getStats.useQuery()

  const jsonExport = trpc.admin.exportJSON.useQuery(
    { filter: exportFilter },
    { enabled: false }
  )

  const csvExport = trpc.admin.exportCSV.useQuery(
    { filter: exportFilter },
    { enabled: false }
  )

  const splitExport = trpc.admin.exportSplit.useQuery(
    { trainRatio, validationRatio, seed },
    { enabled: false }
  )

  const downloadJSON = async () => {
    const result = await jsonExport.refetch()
    if (result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      })
      downloadBlob(blob, `kitvas-dataset-${exportFilter}.json`)
    }
  }

  const downloadCSV = async () => {
    const result = await csvExport.refetch()
    if (result.data) {
      const blob = new Blob([result.data.csv], { type: 'text/csv' })
      downloadBlob(blob, `kitvas-dataset-${exportFilter}.csv`)
    }
  }

  const downloadSplit = async () => {
    const result = await splitExport.refetch()
    if (result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      })
      downloadBlob(blob, `kitvas-dataset-split-${trainRatio}-${validationRatio}.json`)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const testRatio = +(1 - trainRatio - validationRatio).toFixed(2)

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="gradient-hero py-8">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-full text-sm font-medium text-[#10B981] mb-4 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Dataset Export
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Export Dataset
              </h1>
              <p className="text-gray-600">
                Download labeled training data for model improvement
              </p>
            </div>
            <Link
              href="/admin/label"
              className="btn-secondary text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to Labeling
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats */}
        {statsQuery.data && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Labeled Videos"
              value={statsQuery.data.labeledVideos}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              accent="green"
            />
            <StatCard
              label="Total Ingredients"
              value={statsQuery.data.totalIngredients}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
            />
            <StatCard
              label="Total Corrections"
              value={statsQuery.data.totalCorrections}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
              accent="amber"
            />
          </div>
        )}

        {/* Top Ingredients */}
        {statsQuery.data && statsQuery.data.topIngredients.length > 0 && (
          <div className="mb-8 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Top Ingredients in Dataset</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {statsQuery.data.topIngredients.map((ing) => (
                <span
                  key={ing.name}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-[#ECFDF5] text-[#10B981] rounded-lg border border-[#10B981]/20"
                >
                  {ing.name}
                  <span className="text-[#10B981]/60">({ing.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-6">
          {/* Full Export */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Full Export</h2>
                  <p className="text-sm text-gray-500">Download complete dataset as JSON or CSV</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-3">
                  Data Filter
                </label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 w-fit">
                  <button
                    onClick={() => setExportFilter('labeled')}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                      exportFilter === 'labeled'
                        ? 'bg-[#10B981] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Labeled Only
                  </button>
                  <button
                    onClick={() => setExportFilter('all')}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                      exportFilter === 'all'
                        ? 'bg-[#10B981] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Extracted
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={downloadJSON}
                  disabled={jsonExport.isFetching}
                  className="btn-primary disabled:opacity-50"
                >
                  {jsonExport.isFetching ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download JSON
                    </>
                  )}
                </button>
                <button
                  onClick={downloadCSV}
                  disabled={csvExport.isFetching}
                  className="btn-secondary disabled:opacity-50"
                >
                  {csvExport.isFetching ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-400/30 border-t-gray-600 animate-spin"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Split Export */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Train / Validation / Test Split</h2>
                  <p className="text-sm text-gray-500">Export labeled data split into sets for model training</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Train</label>
                    <span className="text-sm font-bold text-[#10B981]">{(trainRatio * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={trainRatio}
                    onChange={(e) => setTrainRatio(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Validation</label>
                    <span className="text-sm font-bold text-purple-600">{(validationRatio * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.3"
                    step="0.05"
                    value={validationRatio}
                    onChange={(e) => setValidationRatio(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Test</label>
                    <span className={`text-sm font-bold ${testRatio < 0.05 ? 'text-red-600' : 'text-blue-600'}`}>
                      {(testRatio * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all ${testRatio < 0.05 ? 'bg-red-400' : 'bg-blue-400'}`}
                      style={{ width: `${testRatio * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Auto-calculated</p>
                </div>
              </div>

              {/* Visual Split Preview */}
              <div className="h-4 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#10B981] transition-all"
                  style={{ width: `${trainRatio * 100}%` }}
                />
                <div
                  className="bg-purple-500 transition-all"
                  style={{ width: `${validationRatio * 100}%` }}
                />
                <div
                  className={`transition-all ${testRatio < 0.05 ? 'bg-red-400' : 'bg-blue-400'}`}
                  style={{ width: `${testRatio * 100}%` }}
                />
              </div>

              <div className="flex items-end gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Random Seed
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                      className="w-32 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">For reproducibility</p>
                </div>

                <div className="flex-1"></div>

                {testRatio < 0.05 && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Test ratio too small (min 5%)
                  </div>
                )}

                <button
                  onClick={downloadSplit}
                  disabled={splitExport.isFetching || testRatio < 0.05}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {splitExport.isFetching ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Split Dataset
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  accent?: 'green' | 'amber'
}) {
  const accentConfig = {
    green: {
      bg: 'bg-[#ECFDF5]',
      iconBg: 'bg-[#10B981]',
      iconText: 'text-white',
    },
    amber: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
    },
  }

  const config = accent ? accentConfig[accent] : {
    bg: 'bg-white',
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
  }

  return (
    <div className={`p-5 rounded-2xl border border-gray-100 shadow-sm ${config.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.iconBg} ${config.iconText} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
