import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface FeedCardProps {
  insight: any;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export function FeedCard({ insight, isSelected, onSelect }: FeedCardProps) {
  const isMock = insight.is_mock;
  const data = insight.insight;

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-start space-x-4">
        <Checkbox className="mt-1" checked={isSelected} onCheckedChange={onSelect} />
        <div>
          <CardTitle className="text-lg font-bold">{data.insight_type}</CardTitle>
          <CardDescription>Source Trace: {data.source_trace_id}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="ml-8">
        <p className="text-sm text-gray-500 mb-2">Metrics: {data.description} (Events: {data.event_count})</p>
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
          <p className="text-sm font-medium">PM Narrative (AI):</p>
          <p className="text-sm mt-1">{insight.narrative}</p>
          {isMock && <span className="inline-block mt-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-bold">Mock Data</span>}
        </div>
      </CardContent>
    </Card>
  );
}
