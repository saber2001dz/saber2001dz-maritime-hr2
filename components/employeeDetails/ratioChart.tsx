import React, { useState } from "react"
import { Pie, PieChart, ResponsiveContainer, Sector, SectorProps } from "recharts"
import { PieChart as PieChartIcon } from "lucide-react"

interface RatioChartProps {
  totalSanctions: number
  totalRecompenses: number
  ratio: string
  isRTL?: boolean
}

type Coordinate = {
  x: number
  y: number
}

type PieSectorData = {
  percent?: number
  name?: string | number
  midAngle?: number
  middleRadius?: number
  tooltipPosition?: Coordinate
  value?: number
  paddingAngle?: number
  dataKey?: string
  payload?: any
}

type PieSectorDataItem = React.SVGProps<SVGPathElement> & Partial<SectorProps> & PieSectorData

const renderActiveShape = (isRTL: boolean) => ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  payload,
  percent,
  value,
}: PieSectorDataItem) => {
  const RADIAN = Math.PI / 180
  const sin = Math.sin(-RADIAN * (midAngle ?? 1))
  const cos = Math.cos(-RADIAN * (midAngle ?? 1))
  // Inverser les calculs pour RTL
  const cosAdjusted = isRTL ? -cos : cos
  const sx = (cx ?? 0) + ((outerRadius ?? 0) + 10) * cosAdjusted
  const sy = (cy ?? 0) + ((outerRadius ?? 0) + 10) * sin
  const mx = (cx ?? 0) + ((outerRadius ?? 0) + 30) * cosAdjusted
  const my = (cy ?? 0) + ((outerRadius ?? 0) + 30) * sin
  const ex = mx + (cosAdjusted >= 0 ? 1 : -1) * 22
  const ey = my
  const textAnchor = cosAdjusted >= 0 ? "start" : "end"

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-medium">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={(outerRadius ?? 0) + 6}
        outerRadius={(outerRadius ?? 0) + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cosAdjusted >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fill="#333"
        className="text-sm font-medium"
      >
        {`${payload.name} ${((percent ?? 1) * 100).toFixed(1)}%`}
      </text>
    </g>
  )
}

function RatioChart({ totalSanctions, totalRecompenses, ratio, isRTL = false }: RatioChartProps) {
  const [isAnimated, setIsAnimated] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  // Préparer les données pour le graphique en secteurs
  const data = [
    {
      name: isRTL ? "التـشـجيـع" : "Récompenses",
      value: totalRecompenses,
      fill: "#10b981",
    },
    {
      name: isRTL ? "العقـوبـات" : "Sanctions",
      value: totalSanctions,
      fill: "#ef4444", 
    },
  ]

  // Déclencher l'animation après le montage du composant
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const total = totalSanctions + totalRecompenses

  // État vide quand aucune donnée n'est disponible
  if (total === 0) {
    return (
      <div className="space-y-6">
        <div
          className={`transition-all duration-1000 delay-300 ${
            isAnimated ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          <div className="h-75 w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <PieChartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {isRTL ? "لا توجد بيانات للعرض" : "Aucune donnée à afficher"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {isRTL 
                    ? "لم يتم تسجيل أي جزاءات أو مكافآت بعد" 
                    : "Aucune sanction ou récompense enregistrée"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Graphique en secteurs */}
      <div
        className={`transition-all duration-1000 delay-300 ${
          isAnimated ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        <div className="h-75 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape(isRTL)}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                onMouseEnter={onPieEnter}
                animationBegin={300}
                animationDuration={1500}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default RatioChart
