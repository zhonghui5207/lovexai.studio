"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppContext } from "@/contexts/app";

export default function DiagnosePage() {
  const { user } = useAppContext();
  const convexUser = useQuery(api.users.current);
  const orders = useQuery(api.orders.listRecent); // We need to add this query

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Payment Diagnosis</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Current User</h2>
          <pre className="bg-gray-900 p-4 rounded overflow-auto">
            {JSON.stringify({
              convexUser: convexUser,
              authParams: user,
            }, null, 2)}
          </pre>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Recent Orders</h2>
          <pre className="bg-gray-900 p-4 rounded overflow-auto h-[500px]">
            {orders ? JSON.stringify(orders, null, 2) : "Loading orders..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
