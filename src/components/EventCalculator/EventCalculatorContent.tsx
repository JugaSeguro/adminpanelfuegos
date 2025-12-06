'use client'

import { Calculator } from 'lucide-react'
import styles from './EventCalculator.module.css'
import { ViewMode } from './types'
import { EventCalculatorHeader } from './components/EventCalculatorHeader'
import { AddEventModal } from './components/modals/AddEventModal'
import { NotesModal } from './components/modals/NotesModal'
import { SelectOrderModal } from './components/modals/SelectOrderModal'
import { HistoryModal } from './components/modals/HistoryModal'
import { MaterialSelectorModal } from './components/modals/MaterialSelectorModal'
import { useEventPDF } from './hooks/useEventPDF'
import { EventListView } from './components/views/EventListView'
import { EventStatsView } from './components/views/EventStatsView'
import { EventComparisonView } from './components/views/EventComparisonView'
import { EventTimelineView } from './components/views/EventTimelineView'
import { useEventCalculator } from './context/EventCalculatorContext'

export const EventCalculatorContent = () => {
    const {
        events,
        loading,
        error,
        filteredEvents,
        saveEvent,
        globalStats,
        grandTotals,
        totalsByCategory,
        comboIngredientsMap,
        products,
        showAddEventModal,
        setShowAddEventModal,
        showSelectOrderModal,
        setShowSelectOrderModal,
        showNotesModal,
        setShowNotesModal,
        showHistoryModal,
        setShowHistoryModal,
        showMaterialSelectorModal,
        setShowMaterialSelectorModal,
        newEventName,
        setNewEventName,
        newEventGuests,
        setNewEventGuests,
        newEventDate,
        setNewEventDate,
        handleAddEvent,
        selectedOrderIds,
        toggleOrderSelection,
        setSelectedOrderIds,
        handleLoadOrdersAsEvents,
        orders,
        currentEventIdForSelector,
        selectedMaterialIds,
        handleMaterialSelectionChange,
        handleAddMaterialsToEvent,
        eventNotes,
        eventVersions,
        restoreVersion,
        availableProducts,
        selectedEventIds,
        setSelectedEventIds,
        handleNotesChange,
        handleObservationsChange,
        handleSaveNotes,
        viewMode,
        setViewMode,
        filters,
        setFilters,
        regeneratingCosts,
        successMessage,
        regenerateAllCosts
    } = useEventCalculator()

    const availableOrders = orders.filter(order =>
        order.status === 'approved' &&
        order.contact.eventDate &&
        order.contact.guestCount > 0
    )

    const { downloadPDF, sharePDF } = useEventPDF({
        filteredEvents,
        products,
        comboIngredientsMap,
        totalsByCategory,
        grandTotals
    })

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Calculator size={48} className={styles.spinner} />
                <p>Cargando eventos...</p>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <EventCalculatorHeader
                eventsCount={events.length}
                regeneratingCosts={regeneratingCosts}
                viewMode={viewMode}
                filters={filters}
                successMessage={successMessage}
                error={error}
                onSelectOrders={() => setShowSelectOrderModal(true)}
                onAddManualEvent={() => setShowAddEventModal(true)}
                onRegenerateCosts={regenerateAllCosts}
                onGeneratePDF={downloadPDF}
                onSharePDF={sharePDF}
                onViewModeChange={setViewMode}
                onFiltersChange={setFilters}
            />

            {events.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Calculator size={48} />
                    </div>
                    <h3>No hay eventos calculados</h3>
                    <p>Selecciona pedidos aprobados para comenzar a calcular ingredientes.</p>
                    <button
                        className={styles.primaryBtn}
                        onClick={() => setShowSelectOrderModal(true)}
                    >
                        Seleccionar Pedidos
                    </button>
                </div>
            ) : (
                <>
                    {viewMode === 'list' && (
                        <div className={styles.eventsContainer}>
                            <EventListView />
                        </div>
                    )}

                    {viewMode === 'timeline' && (
                        <EventTimelineView />
                    )}

                    {viewMode === 'comparison' && (
                        <EventComparisonView />
                    )}

                    {viewMode === 'stats' && (
                        <EventStatsView />
                    )}
                </>
            )}

            <SelectOrderModal
                isOpen={showSelectOrderModal}
                onClose={() => setShowSelectOrderModal(false)}
                orders={availableOrders}
                selectedOrderIds={selectedOrderIds}
                onOrderToggle={toggleOrderSelection}
                onSelectAll={setSelectedOrderIds}
                onLoadOrders={() => handleLoadOrdersAsEvents(availableOrders)}
            />

            <AddEventModal
                isOpen={showAddEventModal}
                onClose={() => setShowAddEventModal(false)}
                onSubmit={handleAddEvent}
                eventName={newEventName}
                eventDate={newEventDate}
                guestCount={newEventGuests}
                onNameChange={setNewEventName}
                onDateChange={setNewEventDate}
                onGuestCountChange={setNewEventGuests}
            />

            {showNotesModal && (() => {
                const event = events.find(e => e.id === showNotesModal)
                if (!event) return null
                return (
                    <NotesModal
                        isOpen={!!showNotesModal}
                        onClose={() => setShowNotesModal(null)}
                        event={event}
                        onNotesChange={(notes) => handleNotesChange(event.id, notes)}
                        onObservationsChange={(observations) => handleObservationsChange(event.id, observations)}
                        onSave={() => handleSaveNotes(event.id)}
                    />
                )
            })()}

            <HistoryModal
                isOpen={!!showHistoryModal}
                onClose={() => setShowHistoryModal(null)}
                eventId={showHistoryModal}
                events={events}
                eventVersions={eventVersions}
                onRestoreVersion={restoreVersion}
            />

            <MaterialSelectorModal
                isOpen={showMaterialSelectorModal}
                onClose={() => setShowMaterialSelectorModal(false)}
                availableProducts={availableProducts}
                selectedMaterialIds={selectedMaterialIds}
                onMaterialToggle={handleMaterialSelectionChange}
                onAddMaterials={handleAddMaterialsToEvent}
                events={events}
                currentEventId={currentEventIdForSelector}
            />
        </div>
    )
}
