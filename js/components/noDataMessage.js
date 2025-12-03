/**
 * No Data Message Component
 * Manages the display of a message when no data is available
 */

class NoDataMessage {
    /**
     * Display a no data message in the container
     * @param {string} containerId - The ID of the container element
     * @param {string|Array} country - The country or countries that had no data
     */
    static display(containerId, country) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }

        // Clear previous content
        container.innerHTML = '';

        // Get the template
        const template = document.getElementById('noDataMessageTemplate');
        if (!template) {
            console.error('No data message template not found');
            return;
        }

        // Clone the template content
        const messageElement = template.cloneNode(true);
        messageElement.removeAttribute('id');
        messageElement.style.display = 'block';

        // Update the country display
        const countryElement = messageElement.querySelector('#noDataCountry');
        if (countryElement) {
            // Format country display - handle both string and array
            if (Array.isArray(country)) {
                countryElement.textContent = country.join(', ');
            } else {
                countryElement.textContent = country || 'Unknown';
            }
        }

        // Append to container
        container.appendChild(messageElement);
    }

    /**
     * Clear the no data message from a container
     * @param {string} containerId - The ID of the container element
     */
    static clear(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            const messageElement = container.querySelector('.no-data-message');
            if (messageElement) {
                messageElement.remove();
            }
        }
    }
}
