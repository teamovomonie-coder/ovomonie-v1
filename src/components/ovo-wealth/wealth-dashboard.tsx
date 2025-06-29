"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PiggyBank, Target, ShieldCheck, Leaf, Users, TrendingUp, DollarSign, PlusCircle } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const chartData = [
  { month: "Jan", returns: 1860 },
  { month: "Feb", returns: 3050 },
  { month: "Mar", returns: 2370 },
  { month: "Apr", returns: 2730 },
  { month: "May", returns: 4090 },
  { month: "Jun", returns: 4540 },
];

const chartConfig = {
  returns: {
    label: "Returns (₦)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const investmentProducts = [
    {
        icon: ShieldCheck,
        title: "Ovo-Fix",
        description: "Lock your funds for a fixed period and enjoy high, guaranteed returns.",
        rate: "Up to 15% p.a."
    },
    {
        icon: Target,
        title: "Ovo-Goals",
        description: "Save towards specific goals like a new car, rent, or tuition.",
        rate: "Up to 12% p.a."
    },
    {
        icon: PiggyBank,
        title: "Ovo-Flex",
        description: "A flexible savings wallet. Withdraw your funds anytime you want.",
        rate: "Up to 10% p.a."
    },
    {
        icon: Users,
        title: "Ovo-Coop",
        description: "Join community cooperative plans to fund projects and earn together.",
        rate: "Variable Returns"
    },
    {
        icon: Leaf,
        title: "Ovo-Grow",
        description: "Invest in high-yield agricultural projects and micro-businesses.",
        rate: "Up to 25% p.a."
    },
];

const userInvestments = [
    { id: 'inv-1', plan: 'Ovo-Fix', principal: 100000, returns: 5000, status: 'Active', maturity: '2024-12-31' },
    { id: 'inv-2', plan: 'My New Car (Ovo-Goals)', principal: 250000, returns: 12000, status: 'Active', maturity: '2025-06-30' },
    { id: 'inv-3', plan: 'Ovo-Grow (Rice Farm)', principal: 50000, returns: 7500, status: 'Active', maturity: '2025-03-20' },
    { id: 'inv-4', plan: 'Ovo-Flex', principal: 75000, returns: 1500, status: 'Flexible', maturity: 'N/A' },
];

export function WealthDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Ovo-Wealth</h2>
            <div className="flex items-center space-x-2">
                <Button>Withdraw</Button>
                <Button variant="secondary"><PlusCircle className="mr-2 h-4 w-4" /> Invest Now</Button>
            </div>
        </div>
        <Tabs defaultValue="portfolio" className="space-y-4">
            <TabsList>
                <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
                <TabsTrigger value="explore">Explore Products</TabsTrigger>
            </TabsList>
            <TabsContent value="portfolio" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦1,250,000</div>
                            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">+₦86,345</div>
                            <p className="text-xs text-muted-foreground">Across 4 active plans</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
                            <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦105,000</div>
                            <p className="text-xs text-muted-foreground">On Dec 31, 2024</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Risk Profile</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Moderate</div>
                            <p className="text-xs text-muted-foreground">Balanced portfolio</p>
                        </CardContent>
                    </Card>
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                         <CardHeader>
                            <CardTitle>Portfolio Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <ResponsiveContainer>
                                    <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value/1000}k`} />
                                        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                        <Bar dataKey="returns" fill="var(--color-returns)" radius={8} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card className="col-span-4 lg:col-span-3">
                         <CardHeader>
                            <CardTitle>My Investments</CardTitle>
                            <CardDescription>Your active investment plans.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plan</TableHead>
                                        <TableHead className="text-right">Returns</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userInvestments.map((investment) => (
                                        <TableRow key={investment.id}>
                                            <TableCell>
                                                <div className="font-medium">{investment.plan}</div>
                                                <div className="text-xs text-muted-foreground">Matures: {investment.maturity}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                +₦{investment.returns.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge>{investment.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="explore" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {investmentProducts.map((product) => (
                        <Card key={product.title} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-muted rounded-lg">
                                        <product.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>{product.title}</CardTitle>
                                        <p className="font-bold text-primary">{product.rate}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <CardDescription>{product.description}</CardDescription>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">Invest Now</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    </div>
  )
}
