import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketDashboard } from './components/MarketDashboard'
import { OrderForm } from './components/OrderForm'
import { OrderList } from './components/OrderList'
import { TradeHistory } from './components/TradeHistory'

export function MarketPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'buy' | 'sell' | 'orders' | 'history'>('dashboard')

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto mt-4">
          <TabsContent value="dashboard" className="mt-0">
            <MarketDashboard />
          </TabsContent>

          <TabsContent value="buy" className="mt-0">
            <OrderForm defaultOrderType="buy" />
          </TabsContent>

          <TabsContent value="sell" className="mt-0">
            <OrderForm defaultOrderType="sell" />
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <OrderList />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <TradeHistory />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

