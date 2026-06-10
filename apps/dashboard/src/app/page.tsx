"use client";

import { useState, useEffect } from "react";
import { FeedCard } from "@/components/FeedCard";
import { BatchCommit } from "@/components/BatchCommit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";

import { VerificationPortal } from "@/components/VerificationPortal";

export default function Dashboard() {
// ... existing states ...
  const [data, setData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { isConnected, address } = useAccount();
  const { connect } = useConnect();

  useEffect(() => {
    fetch("http://localhost:8080/api/v2/insights")
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const selectedInsights = data?.insights?.filter((i: any) => selectedIds.has(i.insight.source_trace_id)) || [];

  return (
    <div className="container mx-auto p-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Lore Verification Dashboard</h1>
        {isConnected ? (
          <div className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">{address?.slice(0, 6)}...{address?.slice(-4)}</div>
        ) : (
          <Button onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>
        )}
      </div>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Live Action Feed</TabsTrigger>
          <TabsTrigger value="verify">Cryptographic Portal</TabsTrigger>
        </TabsList>
        <TabsContent value="feed" className="mt-6">
          <div className="max-w-3xl">
            {data?.insights?.map((insight: any) => (
              <FeedCard 
                key={insight.insight.source_trace_id}
                insight={insight}
                isSelected={selectedIds.has(insight.insight.source_trace_id)}
                onSelect={(checked) => toggleSelect(insight.insight.source_trace_id, checked)}
              />
            ))}
            {!data && <p>Loading insights...</p>}
            {data?.insights?.length === 0 && <p>No insights found on stream.</p>}
          </div>
        </TabsContent>
        <TabsContent value="verify" className="mt-6">
          <div className="max-w-xl p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border shadow-sm">
             <h2 className="text-xl font-bold mb-4">Verify Cryptographic Proof</h2>
             <p className="text-sm text-gray-500 mb-6">Paste your IPFS CID and on-chain Merkle Root to mathematically verify a product decision.</p>
             <VerificationPortal />
          </div>
        </TabsContent>
      </Tabs>

      <BatchCommit selectedInsights={selectedInsights} onSuccess={() => setSelectedIds(new Set())} />
    </div>
  );
}
