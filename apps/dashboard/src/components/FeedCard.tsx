import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Fingerprint } from "lucide-react";

interface FeedCardProps {
  insight: any;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export function FeedCard({ insight, isSelected, onSelect }: FeedCardProps) {
  const isMock = insight.is_mock;
  const data = insight.insight;

  return (
    <Card className={`mb-6 bg-white border-slate-100 transition-all duration-300 hover:border-emerald-300 hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] ${isSelected ? 'border-emerald-400 shadow-[0_5px_20px_rgba(16,185,129,0.15)] bg-emerald-50/30' : ''}`}>
      <CardHeader className="flex flex-row items-start space-x-4 pb-3">
        <Checkbox 
          className="mt-1 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" 
          checked={isSelected} 
          onCheckedChange={onSelect} 
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-emerald-500" />
              {data.insight_type}
            </CardTitle>
            {isMock && (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm">
                SIMULATED DATA
              </span>
            )}
          </div>
          <CardDescription className="text-slate-500 mt-1 flex items-center gap-1.5 font-mono text-xs">
            <Fingerprint className="w-3.5 h-3.5" />
            TRACE: {data.source_trace_id}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="ml-8">
        <p className="text-sm text-slate-600 mb-4 border-l-2 border-emerald-300 pl-3 py-1">
          <span className="text-slate-900 font-semibold">Metrics:</span> {data.description} <span className="text-emerald-600 font-medium">({data.event_count} Events)</span>
        </p>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-teal-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-xs font-bold text-emerald-600 mb-2 tracking-wider uppercase">AI Summary</p>
          <p className="text-sm text-slate-700 leading-relaxed">{insight.narrative}</p>
        </div>
      </CardContent>
    </Card>
  );
}
