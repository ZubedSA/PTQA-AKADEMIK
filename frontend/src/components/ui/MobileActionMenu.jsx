import { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'

const MobileActionMenu = ({ children, actions }) => {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="action-buttons">
            {/* Desktop: Show regular buttons */}
            {children}

            {/* Mobile: Show dropdown */}
            <div className="mobile-action-wrapper" ref={menuRef}>
                <button
                    className="mobile-action-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    title="Menu"
                >
                    <MoreVertical size={18} />
                </button>
                <div className={`mobile-action-menu ${isOpen ? 'show' : ''}`}>
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            className={`mobile-action-item ${action.danger ? 'danger' : ''}`}
                            onClick={() => {
                                action.onClick()
                                setIsOpen(false)
                            }}
                        >
                            {action.icon}
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default MobileActionMenu
