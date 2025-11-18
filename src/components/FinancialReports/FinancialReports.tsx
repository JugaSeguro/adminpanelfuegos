'use client'

import { useState, useEffect, useMemo } from 'react'
import { CateringOrder, FinancialReport, MonthlyFinancialData, ServiceRevenue } from '@/types'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'
import styles from './FinancialReports.module.css'

interface FinancialReportsProps {
  orders: CateringOrder[]
}

type Period = 'month' | 'quarter' | 'year'

const COLORS = {
  completed: '#10b981',
  partial: '#f59e0b',
  pending: '#ef4444'
}

export default function FinancialReports({ orders }: FinancialReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Generar reporte financiero basado en el período seleccionado
  const financialReport = useMemo((): FinancialReport => {
    const now = new Date()
    let startDate: Date
    let periodLabel: string

    switch (selectedPeriod) {
      case 'month':
        startDate = startOfMonth(now)
        periodLabel = format(now, 'MMMM yyyy', { locale: es })
        break
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 2))
        periodLabel = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        periodLabel = now.getFullYear().toString()
        break
    }

    const endDate = endOfMonth(now)
    
    // Filtrar órdenes del período
    const periodOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= startDate && orderDate <= endDate && order.status === 'approved'
    })

    // Calcular métricas principales
    const totalRevenue = periodOrders.reduce((sum, order) => {
      return sum + (order.payment?.paidAmount || 0)
    }, 0)

    const totalOrders = periodOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Desglose de pagos
    const paymentBreakdown = periodOrders.reduce((breakdown, order) => {
      if (!order.payment) return breakdown

      switch (order.payment.paymentStatus) {
        case 'completed':
          breakdown.completed += order.payment.totalAmount
          break
        case 'partial':
          breakdown.partial += order.payment.paidAmount
          breakdown.pending += order.payment.pendingAmount
          break
        case 'pending':
          breakdown.pending += order.payment.totalAmount
          break
      }
      return breakdown
    }, { completed: 0, partial: 0, pending: 0 })

    // Datos mensuales para gráficos
    const months = eachMonthOfInterval({ start: startDate, end: endDate })
    const monthlyData: MonthlyFinancialData[] = months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthOrders = periodOrders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= monthStart && orderDate <= monthEnd
      })

      const monthRevenue = monthOrders.reduce((sum, order) => {
        return sum + (order.payment?.paidAmount || 0)
      }, 0)

      return {
        month: format(month, 'MMM', { locale: es }),
        revenue: monthRevenue,
        orders: monthOrders.length,
        averageValue: monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0
      }
    })

    // Top servicios
    const serviceStats = periodOrders.reduce((stats, order) => {
      const serviceType = order.contact.eventType
      if (!stats[serviceType]) {
        stats[serviceType] = { revenue: 0, orders: 0 }
      }
      stats[serviceType].revenue += order.payment?.paidAmount || 0
      stats[serviceType].orders += 1
      return stats
    }, {} as Record<string, { revenue: number; orders: number }>)

    const topServices: ServiceRevenue[] = Object.entries(serviceStats)
      .map(([service, data]) => ({
        service,
        revenue: data.revenue,
        orders: data.orders,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      period: periodLabel,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      paymentBreakdown,
      monthlyData,
      topServices
    }
  }, [orders, selectedPeriod])

  const formatCurrency = (amount: number) => {
    if (!isMounted) return amount.toString()
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const exportReport = () => {
    // Aquí se implementaría la exportación a PDF/Excel
    console.log('Exportando reporte...', financialReport)
  }

  // Datos para el gráfico de pagos (pie chart)
  const paymentChartData = [
    { name: 'Completados', value: financialReport.paymentBreakdown.completed, color: COLORS.completed },
    { name: 'Parciales', value: financialReport.paymentBreakdown.partial, color: COLORS.partial },
    { name: 'Pendientes', value: financialReport.paymentBreakdown.pending, color: COLORS.pending }
  ].filter(item => item.value > 0)

  if (!isMounted) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          Cargando reportes...
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Reportes Financieros</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className={styles.periodSelector}>
            <button
              className={`${styles.periodBtn} ${selectedPeriod === 'month' ? styles.active : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              Mes
            </button>
            <button
              className={`${styles.periodBtn} ${selectedPeriod === 'quarter' ? styles.active : ''}`}
              onClick={() => setSelectedPeriod('quarter')}
            >
              Trimestre
            </button>
            <button
              className={`${styles.periodBtn} ${selectedPeriod === 'year' ? styles.active : ''}`}
              onClick={() => setSelectedPeriod('year')}
            >
              Año
            </button>
          </div>
          <button className={styles.exportBtn} onClick={exportReport}>
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {financialReport.totalOrders === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyText}>No hay datos para este período</div>
          <div className={styles.emptySubtext}>
            Los reportes aparecerán cuando tengas pedidos aprobados en el período seleccionado
          </div>
        </div>
      ) : (
        <>
          {/* Resumen general */}
          <div className={styles.overview}>
            <div className={`${styles.overviewCard} ${styles.revenue}`}>
              <div className={styles.overviewLabel}>Ingresos Totales</div>
              <div className={styles.overviewValue}>
                {formatCurrency(financialReport.totalRevenue)}
              </div>
              <div className={styles.overviewChange}>
                {financialReport.period}
              </div>
            </div>

            <div className={`${styles.overviewCard} ${styles.orders}`}>
              <div className={styles.overviewLabel}>Total de Pedidos</div>
              <div className={styles.overviewValue}>
                {financialReport.totalOrders}
              </div>
              <div className={styles.overviewChange}>
                Pedidos aprobados
              </div>
            </div>

            <div className={`${styles.overviewCard} ${styles.average}`}>
              <div className={styles.overviewLabel}>Valor Promedio</div>
              <div className={styles.overviewValue}>
                {formatCurrency(financialReport.averageOrderValue)}
              </div>
              <div className={styles.overviewChange}>
                Por pedido
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className={styles.chartsSection}>
            <div className={styles.chartsGrid}>
              {/* Gráfico de ingresos mensuales */}
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Evolución de Ingresos</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={financialReport.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `€${value}`} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                        labelFormatter={(label) => `Mes: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#d97706" 
                        strokeWidth={3}
                        dot={{ fill: '#d97706', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Desglose de pagos */}
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Estado de Pagos</h3>
                <div className={styles.paymentBreakdown}>
                  {paymentChartData.map((item, index) => (
                    <div key={index} className={styles.paymentItem}>
                      <div className={styles.paymentLabel}>
                        <div 
                          className={styles.paymentDot}
                          style={{ backgroundColor: item.color }}
                        ></div>
                        {item.name}
                      </div>
                      <div className={styles.paymentValue}>
                        {formatCurrency(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top servicios */}
          <div className={styles.topServices}>
            <h3 className={styles.chartTitle}>Servicios Más Rentables</h3>
            <div className={styles.servicesGrid}>
              {financialReport.topServices.map((service, index) => (
                <div key={index} className={styles.serviceCard}>
                  <div className={styles.serviceName}>{service.service}</div>
                  <div className={styles.serviceRevenue}>
                    {formatCurrency(service.revenue)}
                  </div>
                  <div className={styles.serviceOrders}>
                    {service.orders} pedidos
                  </div>
                  <div className={styles.servicePercentage}>
                    {formatPercentage(service.percentage)} del total
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de datos mensuales */}
          <div className={styles.monthlyTable}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Desglose Mensual</h3>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Ingresos</th>
                  <th>Pedidos</th>
                  <th>Valor Promedio</th>
                </tr>
              </thead>
              <tbody>
                {financialReport.monthlyData.map((month, index) => (
                  <tr key={index}>
                    <td>{month.month}</td>
                    <td>{formatCurrency(month.revenue)}</td>
                    <td>{month.orders}</td>
                    <td>{formatCurrency(month.averageValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}