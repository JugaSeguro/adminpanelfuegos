'use client'

import React from 'react'
import { BudgetEditorProps } from './types'
import { useBudgetData } from './hooks/useBudgetData'
import { useBudgetCalculations } from './hooks/useBudgetCalculations'
import { useMaterialSelector } from './hooks/useMaterialSelector'
import { ClientInfoSection } from './components/ClientInfoSection'
import { MenuSection } from './components/MenuSection'
import { ServiceSection } from './components/ServiceSection'
import { MaterialSection } from './components/MaterialSection'
import { DeliveryRepriseSection } from './components/DeliveryRepriseSection'
import { BoissonsSoftSection } from './components/BoissonsSoftSection'
import { DeplacementSection } from './components/DeplacementSection'
import { TotalsSection } from './components/TotalsSection'
import { BudgetActions } from './components/BudgetActions'
import { MaterialSelectorModal } from './components/MaterialSelectorModal'
import styles from './BudgetEditor.module.css'

export function BudgetEditor({ budgetId, onBudgetDeleted }: BudgetEditorProps) {
    const {
        budget,
        loading,
        error,
        saving,
        saveBudget,
        deleteBudget: deleteBudgetApi,
        approveAndSend,
        generatePDF
    } = useBudgetData(budgetId)

    const {
        editedData,
        updateField,
        setEditedData
    } = useBudgetCalculations(budget?.budget_data || null)

    // Sincronizar datos cuando se carga el presupuesto
    React.useEffect(() => {
        if (budget?.budget_data) {
            setEditedData(budget.budget_data)
        }
    }, [budget, setEditedData])

    const {
        availableMaterials,
        showMaterialSelector,
        setShowMaterialSelector,
        selectedMaterialIds,
        toggleMaterialSelection,
        addSelectedMaterials
    } = useMaterialSelector()

    if (loading) {
        return <div className={styles.loading}>Cargando presupuesto...</div>
    }

    if (error) {
        return <div className={styles.error}>{error}</div>
    }

    if (!editedData) {
        return <div className={styles.error}>No se pudo cargar el presupuesto</div>
    }

    const handleSave = async () => {
        await saveBudget(editedData)
    }

    const handleApproveAndSend = async () => {
        if (!budget?.pdf_url) {
            alert('⚠️ Por favor genera el PDF antes de aprobar y enviar')
            return
        }

        const confirmMessage = `¿Estás seguro de aprobar y enviar este presupuesto?\n\nCliente: ${editedData.clientInfo.name}\nEmail: ${editedData.clientInfo.email}\nTotal: ${editedData.totals.totalTTC.toFixed(2)}€`

        if (!window.confirm(confirmMessage)) {
            return
        }

        const result = await approveAndSend(editedData.clientInfo.email, editedData.clientInfo.name)
        if (result.success) {
            if (result.result.note) {
                const message = result.result.warning
                    ? `✅ Presupuesto aprobado exitosamente!\n\n⚠️ ${result.result.note}`
                    : `✅ Presupuesto aprobado exitosamente!\n\n⚠️ ${result.result.note}\n\nPDF: ${result.result.pdfUrl}`
                alert(message)
            } else {
                alert('✅ Presupuesto aprobado y enviado al cliente por email')
            }
        } else {
            alert(`❌ Error al aprobar presupuesto: ${result.error}`)
        }
    }

    const handleDeleteBudget = async () => {
        if (!window.confirm('⚠️ ¿Estás seguro de que quieres eliminar este presupuesto PERMANENTEMENTE?\n\nEsta acción no se puede deshacer.')) {
            return
        }

        const result = await deleteBudgetApi()
        if (result.success) {
            alert('✅ Presupuesto eliminado correctamente')
            if (onBudgetDeleted) {
                onBudgetDeleted()
            } else {
                window.location.reload()
            }
        } else {
            alert('❌ Error al eliminar el presupuesto')
        }
    }

    const handleGeneratePDF = async () => {
        const result = await generatePDF(editedData)
        if (result.success && result.pdfUrl) {
            console.log('✅ PDF generado:', result.pdfUrl)
            const pdfUrlWithCache = `${result.pdfUrl}${result.pdfUrl.includes('?') ? '&' : '?'}_=${Date.now()}`
            window.open(pdfUrlWithCache, '_blank')
        } else {
            alert(`Error al generar PDF: ${result.error}`)
        }
    }

    // Handlers para agregar/eliminar secciones
    const addSection = (sectionName: string, initialData: any) => {
        updateField(sectionName, initialData)
    }

    const removeSection = (sectionName: string) => {
        if (window.confirm(`¿Eliminar sección de ${sectionName}?`)) {
            const newData = { ...editedData }
            // @ts-expect-error: Dynamic key access on BudgetData
            delete newData[sectionName]
            setEditedData(newData) // Esto recalculará totales en el hook
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Editor de Presupuesto</h1>
                <div className={styles.statusContainer}>
                    <span className={`${styles.statusBadge} ${styles[`status${(budget?.status || 'draft').charAt(0).toUpperCase() + (budget?.status || 'draft').slice(1)}`]}`}>
                        {budget?.status || 'Borrador'}
                    </span>
                    <span className={styles.versionBadge}>v{budget?.version}</span>
                    <button
                        onClick={handleDeleteBudget}
                        className={styles.deleteBudgetBtn}
                        title="Eliminar presupuesto"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <MaterialSelectorModal
                isOpen={showMaterialSelector}
                onClose={() => setShowMaterialSelector(false)}
                availableMaterials={availableMaterials}
                selectedMaterialIds={selectedMaterialIds}
                onToggleSelection={toggleMaterialSelection}
                onAddSelected={() => addSelectedMaterials(editedData, setEditedData)}
                existingItemNames={editedData.material?.items.map(i => i.name) || []}
            />

            <ClientInfoSection
                data={editedData.clientInfo}
                onUpdate={updateField}
            />

            <MenuSection
                data={editedData.menu}
                onUpdate={updateField}
            />

            {editedData.service ? (
                <ServiceSection
                    data={editedData.service}
                    onUpdate={updateField}
                    onDelete={() => removeSection('service')}
                />
            ) : (
                <div className={`${styles.section} ${styles.addSectionContainer}`}>
                    <p>No hay servicio configurado</p>
                    <button
                        className={styles.addSectionBtn}
                        onClick={() => addSection('service', {
                            mozos: 1,
                            hours: 1,
                            pricePerHour: 40,
                            totalHT: 40,
                            tva: 8,
                            tvaPct: 20,
                            totalTTC: 48
                        })}
                    >
                        ➕ Agregar Servicio
                    </button>
                </div>
            )}

            {editedData.material ? (
                <MaterialSection
                    data={editedData.material}
                    onUpdate={updateField}
                    onDelete={() => removeSection('material')}
                    onOpenSelector={() => setShowMaterialSelector(true)}
                />
            ) : (
                <div className={`${styles.section} ${styles.addSectionContainer}`}>
                    <p>No hay materiales configurados</p>
                    <button
                        className={styles.addSectionBtn}
                        onClick={() => addSection('material', {
                            items: [], tvaPct: 20, totalHT: 0, tva: 0, totalTTC: 0, insurancePct: 6, insuranceAmount: 0
                        })}
                    >
                        ➕ Agregar Material
                    </button>
                </div>
            )}

            {editedData.deliveryReprise ? (
                <DeliveryRepriseSection
                    data={editedData.deliveryReprise}
                    onUpdate={updateField}
                    onDelete={() => removeSection('deliveryReprise')}
                />
            ) : (
                <div className={`${styles.section} ${styles.addSectionContainer}`}>
                    <p>No hay entrega/recogida configurada</p>
                    <button
                        className={styles.addSectionBtn}
                        onClick={() => addSection('deliveryReprise', {
                            deliveryCost: 0, pickupCost: 0, totalHT: 0, tva: 0, tvaPct: 20, totalTTC: 0
                        })}
                    >
                        ➕ Agregar Entrega/Recogida
                    </button>
                </div>
            )}

            {editedData.boissonsSoft ? (
                <BoissonsSoftSection
                    data={editedData.boissonsSoft}
                    onUpdate={updateField}
                    onDelete={() => removeSection('boissonsSoft')}
                />
            ) : (
                <div className={`${styles.section} ${styles.addSectionContainer}`}>
                    <p>No hay bebidas soft configuradas</p>
                    <button
                        className={styles.addSectionBtn}
                        onClick={() => addSection('boissonsSoft', {
                            pricePerPerson: 0, totalPersons: 0, totalHT: 0, tva: 0, tvaPct: 20, totalTTC: 0
                        })}
                    >
                        ➕ Agregar Boissons Soft
                    </button>
                </div>
            )}

            {editedData.deplacement ? (
                <DeplacementSection
                    data={editedData.deplacement}
                    onUpdate={updateField}
                    onDelete={() => removeSection('deplacement')}
                />
            ) : (
                <div className={`${styles.section} ${styles.addSectionContainer}`}>
                    <p>No hay desplazamiento configurado</p>
                    <button
                        className={styles.addSectionBtn}
                        onClick={() => addSection('deplacement', {
                            distance: 0, pricePerKm: 0, totalHT: 0, tva: 0, tvaPct: 20, totalTTC: 0
                        })}
                    >
                        ➕ Agregar Desplazamiento
                    </button>
                </div>
            )}

            <TotalsSection
                data={editedData.totals}
                onUpdate={updateField}
            />

            <BudgetActions
                onSave={handleSave}
                onApproveAndSend={handleApproveAndSend}
                onGeneratePDF={handleGeneratePDF}
                saving={saving}
                hasPdf={!!budget?.pdf_url}
            />
        </div>
    )
}
