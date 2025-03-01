/**
 * Script para mostrar indicadores visuales de mensajes no leídos en la lista de pedidos
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de mensajes no leídos cargado');
    
    // Mejorar la tabla de órdenes con indicadores de mensajes no leídos
    enhanceOrdersTable();
    
    // Configurar el marcado de mensajes como leídos
    setupMessageReadMarking();
    
    // Modificar la función updateOrdersTable original
    modifyUpdateOrdersTable();
});

/**
 * Agrega los estilos CSS necesarios para el indicador de mensajes no leídos
 */
function addUnreadIndicatorStyles() {
    // Verificar si los estilos ya existen
    if (!document.getElementById('unread-indicator-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'unread-indicator-styles';
        styleElement.textContent = `
            .unread-indicator {
                display: inline-block;
                width: 10px;
                height: 10px;
                background-color: #dc3545;
                border-radius: 50%;
                margin-right: 8px;
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0% {
                    opacity: 0.5;
                    transform: scale(1);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.2);
                }
                100% {
                    opacity: 0.5;
                    transform: scale(1);
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
}

/**
 * Modifica la función updateOrdersTable original para incluir indicadores de mensajes no leídos
 */
function modifyUpdateOrdersTable() {
    // Guardar la función original
    const originalUpdateOrdersTable = window.updateOrdersTable;
    
    // Reemplazar con nuestra versión mejorada
    window.updateOrdersTable = function(orders) {
        // Llamar a la función original
        originalUpdateOrdersTable(orders);
        
        // Aplicar nuestras mejoras
        enhanceOrdersTable();
        setupMessageReadMarking();
    };
}

/**
 * Mejora la tabla de pedidos con indicadores de mensajes no leídos
 */
function enhanceOrdersTable() {
    const orderRows = document.querySelectorAll('#ordersTableBody tr');
    
    orderRows.forEach(row => {
        if (row.getAttribute('data-has-unread-messages') === 'true') {
            const customerNameCell = row.querySelector('td:nth-child(2)'); // Segunda columna (nombre del cliente)
            if (customerNameCell) {
                // Verificar si ya existe un indicador
                if (!customerNameCell.querySelector('.unread-indicator')) {
                    // Crear el indicador de mensajes no leídos
                    const unreadIndicator = document.createElement('span');
                    unreadIndicator.className = 'unread-indicator';
                    unreadIndicator.setAttribute('title', 'Mensajes no leídos');
                    
                    // Insertar el indicador antes del nombre del cliente
                    customerNameCell.insertBefore(unreadIndicator, customerNameCell.firstChild);
                }
            }
        }
    });
    
    // Agregar estilos CSS para el indicador
    addUnreadIndicatorStyles();
}

/**
 * Configura la funcionalidad para marcar mensajes como leídos al hacer clic en un pedido
 */
function setupMessageReadMarking() {
    const orderRows = document.querySelectorAll('#ordersTableBody tr');
    
    orderRows.forEach(row => {
        row.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            if (orderId && this.getAttribute('data-has-unread-messages') === 'true') {
                markMessagesAsRead(orderId);
            }
        });
    });
}

/**
 * Marca los mensajes de un pedido como leídos
 * @param {string} orderId - ID del pedido
 */
async function markMessagesAsRead(orderId) {
    console.log(`Marcando mensajes como leídos para el pedido ${orderId}`);
    
    try {
        const response = await fetch('/api/mark-messages-read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderId })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error al marcar mensajes como leídos: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Respuesta del servidor:', result);
        
        // Si la respuesta indica que está procesando, esperar un momento y luego actualizar la UI
        if (result.status === 'processing') {
            console.log('El servidor está procesando la solicitud en segundo plano');
            
            // Actualizar la UI inmediatamente para mejorar la experiencia del usuario
            updateUIAfterMarkingRead(orderId);
            
            // Opcionalmente, podríamos verificar el estado después de un tiempo
            setTimeout(() => {
                console.log('Verificando estado de los mensajes después del tiempo de espera');
                // Aquí podríamos hacer una solicitud para verificar el estado actual
            }, 2000);
        } else {
            // Actualizar la UI si la respuesta es inmediata
            updateUIAfterMarkingRead(orderId);
        }
    } catch (error) {
        console.error('Error al marcar mensajes como leídos:', error);
    }
}

/**
 * Actualiza la UI después de marcar mensajes como leídos
 * @param {string} orderId - ID del pedido
 */
function updateUIAfterMarkingRead(orderId) {
    const row = document.querySelector(`#ordersTableBody tr[data-id="${orderId}"]`);
    if (row) {
        // Actualizar el atributo
        row.setAttribute('data-has-unread-messages', 'false');
        
        // Eliminar el indicador visual
        const indicator = row.querySelector('.unread-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
} 