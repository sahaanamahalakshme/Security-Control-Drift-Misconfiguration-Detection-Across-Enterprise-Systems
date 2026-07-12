import { LiveTag } from './Badges'

export default function SectionCard({ title, subtitle, isLive, count, action, children, className = '', icon: Icon }) {
  return (
    <div className={`bg-white rounded-xl border border-[#E8EAED] shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EAED]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-[#1B7B6F] shrink-0" />}
            <h3 className="text-sm font-semibold text-[#1A2332] truncate">{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-[#8B95A1] mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {typeof count === 'number' && (
            <span className="text-[11px] font-medium text-[#8B95A1] bg-[#F4F6F8] px-2 py-0.5 rounded-md border border-[#E8EAED]">
              {count} items
            </span>
          )}
          {typeof isLive === 'boolean' && <LiveTag isLive={isLive} />}
          {action}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function EmptyState({ text, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {Icon && <Icon className="w-8 h-8 text-[#C8D6D4] mb-2.5" />}
      <p className="text-[13px] text-[#8B95A1]">{text}</p>
    </div>
  )
}
