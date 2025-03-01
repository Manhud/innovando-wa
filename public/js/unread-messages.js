/**
 * Script para mostrar indicadores visuales de mensajes no leídos en la lista de pedidos
 */
document.addEventListener('DOMContentLoaded', function() {
    // Agregar estilos CSS para el indicador de mensajes no leídos
    addUnreadIndicatorStyles();
    
    // Modificar la función updateOrdersTable original
    modifyUpdateOrdersTable();
    
    // Configurar la funcionalidad para marcar mensajes como leídos
    setupMessageReadMarking();
    
    console.log('Script de mensajes no leídos cargado correctamente');
});

/**
 * Agrega los estilos CSS necesarios para el indicador de mensajes no leídos
 */
function addUnreadIndicatorStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .unread-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            background-color: #dc3545;
            border-radius: 50%;
            margin-left: 5px;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
            }
            70% {
                transform: scale(1);
                box-shadow: 0 0 0 5px rgba(220, 53, 69, 0);
            }
            100% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
            }
        }
    `;
    document.head.appendChild(styleElement);
}

/**
 * Modifica la función updateOrdersTable original para incluir indicadores de mensajes no leídos
 */
function modifyUpdateOrdersTable() {
    // Guardar la función original
    const originalUpdateOrdersTable = window.updateOrdersTable;
    
    // Reemplazar con nuestra versión mejorada
    window.updateOrdersTable = function(orders) {
        // Llamar a la función original primero
        originalUpdateOrdersTable(orders);
        
        // Luego mejorar la tabla con indicadores de mensajes no leídos
        enhanceOrdersTable(orders);
    };
}

/**
 * Mejora la tabla de pedidos con indicadores de mensajes no leídos
 */
function enhanceOrdersTable(orders) {
    // Obtener todas las filas de pedidos
    const orderRows = document.querySelectorAll('.order-details');
    
    // Iterar sobre cada fila
    orderRows.forEach(row => {
        const orderId = row.getAttribute('data-order-id');
        
        // Encontrar el pedido correspondiente
        const order = orders.find(o => o.order_id === orderId);
        
        if (order && order.has_unread_messages) {
            // Agregar el atributo data-has-unread-messages
            row.setAttribute('data-has-unread-messages', 'true');
            
            // Agregar el indicador visual junto al nombre del cliente
            const customerCell = row.querySelector('td:nth-child(2)');
            if (customerCell && !customerCell.querySelector('.unread-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'unread-indicator';
                indicator.title = 'Mensajes no leídos';
                customerCell.appendChild(indicator);
            }
        }
    });
}

/**
 * Configura la funcionalidad para marcar mensajes como leídos al hacer clic en un pedido
 */
function setupMessageReadMarking() {
    // Agregar un delegado de eventos para manejar clics en filas de pedidos
    document.querySelector('#ordersTableBody').addEventListener('click', function(event) {
        // Encontrar la fila de pedido más cercana
        const orderRow = event.target.closest('.order-details');
        
        if (orderRow) {
            const orderId = orderRow.getAttribute('data-order-id');
            const hasUnreadMessages = orderRow.getAttribute('data-has-unread-messages') === 'true';
            
            // Si hay mensajes no leídos, marcarlos como leídos
            if (hasUnreadMessages) {
                markMessagesAsRead(orderId, orderRow);
            }
        }
    });
}

/**
 * Marca los mensajes de un pedido como leídos
 * @param {string} orderId - ID del pedido
 * @param {HTMLElement} orderRow - Elemento de fila del pedido
 */
async function markMessagesAsRead(orderId, orderRow) {
    try {
        const response = await fetch('/api/mark-messages-read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderId })
        });
        
        if (!response.ok) {
            throw new Error(`Error al marcar mensajes como leídos: ${response.status}`);
        }
        
        console.log(`Mensajes del pedido ${orderId} marcados como leídos`);
        
        // Actualizar visualmente el indicador de mensajes no leídos
        orderRow.setAttribute('data-has-unread-messages', 'false');
        const unreadIndicator = orderRow.querySelector('.unread-indicator');
        if (unreadIndicator) {
            unreadIndicator.remove();
        }
    } catch (error) {
        console.error('Error al marcar mensajes como leídos:', error);
    }
} 