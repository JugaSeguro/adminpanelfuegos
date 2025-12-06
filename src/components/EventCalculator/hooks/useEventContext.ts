import { useContext } from 'react'
import { EventStateContext, EventDispatchContext } from '../context/EventCalculatorContext'

// Hook to access only the state (data)
// Components using this will re-render when ANY data changes
export const useEventState = () => {
    const context = useContext(EventStateContext)
    if (!context) {
        throw new Error('useEventState must be used within an EventCalculatorProvider')
    }
    return context
}

// Hook to access only the actions (dispatch)
// Components using this will NOT re-render when data changes (if memoized correctly)
export const useEventActions = () => {
    const context = useContext(EventDispatchContext)
    if (!context) {
        throw new Error('useEventActions must be used within an EventCalculatorProvider')
    }
    return context
}
