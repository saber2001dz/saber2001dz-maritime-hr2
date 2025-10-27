"use client"

import { Area, AreaChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ChartProps {
  data: any[]
  config: ChartConfig
  xAxisKey: string
  lineKey: string
  rtl?: boolean
}

export function EmployeesAreaChart({ data, config, xAxisKey, lineKey, rtl = false }: ChartProps) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[180px] w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          top: 20,
          left: rtl ? 12 : 0,
          right: rtl ? 0 : 12,
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis
          dataKey={xAxisKey}
          tickLine={true}
          axisLine={true}
          tickMargin={10}
          tick={{ fontSize: 10 }}
          reversed={rtl}
        />
        <YAxis
          tickLine={true}
          axisLine={true}
          tickMargin={rtl ? 20 : 10}
          tick={{ fontSize: 10 }}
          orientation={rtl ? "right" : "left"}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" dir={rtl ? "rtl" : "ltr"} />} />
        <defs>
          <linearGradient id={`fill${lineKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={`var(--color-${lineKey})`} stopOpacity={0.8} />
            <stop offset="95%" stopColor={`var(--color-${lineKey})`} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          dataKey={lineKey}
          type="natural"
          stroke={`var(--color-${lineKey})`}
          fill={`url(#fill${lineKey})`}
          fillOpacity={0.4}
          strokeWidth={2}
          dot={{
            fill: `var(--color-${lineKey})`,
            strokeWidth: 1.5,
            r: 3,
          }}
          activeDot={{
            r: 6,
          }}
        >
          <LabelList position="top" offset={10} className="fill-foreground" fontSize={10} />
        </Area>
      </AreaChart>
    </ChartContainer>
  )
}
