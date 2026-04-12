/**
 * SplitPanel — two-column translation layout with a swap control between panels.
 * On small screens it stacks vertically; on md+ it's side-by-side.
 */
export default function SplitPanel({ leftPanel, rightPanel, swapButton }) {
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4">
      {/* Source Panel */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
        {leftPanel}
      </div>

      {/* Swap control — centred between the two panels */}
      <div className="flex items-center justify-center py-2 md:py-0">
        {swapButton}
      </div>

      {/* Target Panel */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
        {rightPanel}
      </div>
    </div>
  )
}
