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
        const $container = $('#' + containerId);
        if ($container.length === 0) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }

        // Clear previous content
        $container.empty();

        // Get the template
        const $template = $('#noDataMessageTemplate');
        if ($template.length === 0) {
            console.error('No data message template not found');
            return;
        }

        // Clone the template content
        const $messageElement = $template.clone();
        $messageElement.removeAttr('id');
        $messageElement.css('display', 'block');

        // Update the country display
        const $countryElement = $messageElement.find('#noDataCountry');
        if ($countryElement.length > 0) {
            // Format country display - handle both string and array
            if (Array.isArray(country)) {
                $countryElement.text(country.join(', '));
            } else {
                $countryElement.text(country || 'Unknown');
            }
        }

        // Append to container
        $container.append($messageElement);
    }

    /**
     * Clear the no data message from a container
     * @param {string} containerId - The ID of the container element
     */
    static clear(containerId) {
        const $container = $('#' + containerId);
        if ($container.length > 0) {
            $container.find('.no-data-message').remove();
        }
    }
}
