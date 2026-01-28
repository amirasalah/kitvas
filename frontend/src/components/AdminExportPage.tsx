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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Export Dataset</h1>
              <p className="text-gray-600 mt-1">
                Download labeled training data for model improvement
              </p>
            </div>
            <Link
              href="/admin/label"
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Back to Labeling
            </Link>
          </div>
        </header>

        {/* Stats */}
        {statsQuery.data && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Labeled Videos</p>
              <p className="text-3xl font-bold">
                {statsQuery.data.labeledVideos}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Ingredients</p>
              <p className="text-3xl font-bold">
                {statsQuery.data.totalIngredients}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Corrections</p>
              <p className="text-3xl font-bold">
                {statsQuery.data.totalCorrections}
              </p>
            </div>
          </div>
        )}

        {/* Top Ingredients */}
        {statsQuery.data && statsQuery.data.topIngredients.length > 0 && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Top Ingredients in Dataset</h3>
            <div className="flex flex-wrap gap-2">
              {statsQuery.data.topIngredients.map((ing) => (
                <span
                  key={ing.name}
                  className="text-xs px-2 py-1 bg-white border border-gray-300 rounded"
                >
                  {ing.name}{' '}
                  <span className="text-gray-400">({ing.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-6">
          {/* Full Export */}
          <div className="p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Full Export</h2>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Data Filter
              </label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit">
                <button
                  onClick={() => setExportFilter('labeled')}
                  className={`px-4 py-2 text-sm ${
                    exportFilter === 'labeled'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Labeled Only
                </button>
                <button
                  onClick={() => setExportFilter('all')}
                  className={`px-4 py-2 text-sm ${
                    exportFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
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
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {jsonExport.isFetching ? 'Exporting...' : 'Download JSON'}
              </button>
              <button
                onClick={downloadCSV}
                disabled={csvExport.isFetching}
                className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {csvExport.isFetching ? 'Exporting...' : 'Download CSV'}
              </button>
            </div>
          </div>

          {/* Split Export */}
          <div className="p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              Train / Validation / Test Split
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Export labeled data split into training, validation, and test sets
              for model training.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Train ({(trainRatio * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={trainRatio}
                  onChange={(e) => setTrainRatio(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Validation ({(validationRatio * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.3"
                  step="0.05"
                  value={validationRatio}
                  onChange={(e) =>
                    setValidationRatio(parseFloat(e.target.value))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Test ({(testRatio * 100).toFixed(0)}%)
                </label>
                <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Random Seed (for reproducibility)
              </label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {testRatio < 0.05 && (
              <p className="text-sm text-red-600 mb-3">
                Test ratio is too small ({(testRatio * 100).toFixed(0)}%). Adjust
                train/validation so test is at least 5%.
              </p>
            )}

            <button
              onClick={downloadSplit}
              disabled={splitExport.isFetching || testRatio < 0.05}
              className="px-6 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {splitExport.isFetching
                ? 'Generating Split...'
                : 'Download Split Dataset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
