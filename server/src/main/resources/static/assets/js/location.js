/**
 * Fresh Greens — Location Detection Module
 *
 * Uses ip-api.com (free, no key) for automatic city detection,
 * with manual override stored in localStorage.
 */
const FGLocation = (function () {
    'use strict';

    const STORAGE_KEY = 'fg_location';
    const IP_API_URL = 'http://ip-api.com/json/?fields=status,city,regionName,zip,lat,lon';

    let _currentLocation = null;

    /**
     * Initialize — load from storage or detect via IP
     */
    function init() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            _currentLocation = JSON.parse(stored);
            _updateUI();
            return Promise.resolve(_currentLocation);
        }
        return detect();
    }

    /**
     * Detect location via IP geolocation API
     */
    function detect() {
        return $.ajax({
            url: IP_API_URL,
            method: 'GET',
            timeout: 5000
        }).then(function (data) {
            if (data.status === 'success') {
                _currentLocation = {
                    city: data.city,
                    region: data.regionName,
                    pincode: data.zip,
                    lat: data.lat,
                    lon: data.lon,
                    source: 'auto'
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(_currentLocation));
                _updateUI();
                return _currentLocation;
            }
            return _fallback();
        }).catch(function () {
            return _fallback();
        });
    }

    /**
     * Manual override — user types city/pincode
     */
    function setManual(city, pincode) {
        _currentLocation = {
            city: city,
            region: '',
            pincode: pincode || '',
            lat: null,
            lon: null,
            source: 'manual'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_currentLocation));
        _updateUI();
        $(document).trigger('fg:location:changed', [_currentLocation]);
        return _currentLocation;
    }

    /**
     * Get current location
     */
    function get() {
        return _currentLocation;
    }

    /**
     * Get city string for display
     */
    function getDisplayText() {
        if (!_currentLocation) return 'Set Location';
        if (_currentLocation.pincode) {
            return _currentLocation.city + ' — ' + _currentLocation.pincode;
        }
        return _currentLocation.city || 'Set Location';
    }

    /**
     * Clear stored location
     */
    function clear() {
        _currentLocation = null;
        localStorage.removeItem(STORAGE_KEY);
        _updateUI();
    }

    function _fallback() {
        _currentLocation = { city: '', region: '', pincode: '', source: 'none' };
        _updateUI();
        return _currentLocation;
    }

    function _updateUI() {
        $('.location-text').text(getDisplayText());
    }

    return {
        init: init,
        detect: detect,
        setManual: setManual,
        get: get,
        getDisplayText: getDisplayText,
        clear: clear
    };
})();
