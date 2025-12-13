/**
 * Theme management module
 * Handles dark mode toggle and persistence
 */

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'theme-preference';
        this.DARK_MODE_CLASS = 'dark-mode';
        this.init();
    }

    /**
     * Initialize theme on page load
     */
    init() {
        $(document).ready(() => {
            // Check for saved preference or system preference
            const savedTheme = this.getSavedTheme();
            const prefersDark = this.prefersSystemDarkMode();

            if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
                this.enableDarkMode();
            } else {
                this.disableDarkMode();
            }

            // Set up toggle button listener
            this.setupToggleButton();
        });
    }

    /**
     * Get saved theme preference from localStorage
     */
    getSavedTheme() {
        return localStorage.getItem(this.STORAGE_KEY);
    }

    /**
     * Check if system prefers dark mode
     */
    prefersSystemDarkMode() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Enable dark mode
     */
    enableDarkMode() {
        $('body').addClass(this.DARK_MODE_CLASS);
        localStorage.setItem(this.STORAGE_KEY, 'dark');
        this.updateToggleButton(true);
    }

    /**
     * Disable dark mode (enable light mode)
     */
    disableDarkMode() {
        $('body').removeClass(this.DARK_MODE_CLASS);
        localStorage.setItem(this.STORAGE_KEY, 'light');
        this.updateToggleButton(false);
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        console.log('Changing theme');
        const isDarkMode = $('body').hasClass(this.DARK_MODE_CLASS);
        if (isDarkMode) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
        heatmap.render()
    }

    /**
     * Set up toggle button event listener
     */
    setupToggleButton() {
        $('#theme-toggle').on('click', () => this.toggleTheme());
    }

    /**
     * Update toggle button text based on current theme
     */
    updateToggleButton(isDarkMode) {
        $('#theme-toggle').text(isDarkMode ? '☀️' : '🌙');
    }

    /**
     * Check if dark mode is currently enabled
     */
    isDarkMode() {
        return $('body').hasClass(this.DARK_MODE_CLASS);
    }
}
