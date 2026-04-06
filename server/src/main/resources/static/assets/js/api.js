/**
 * Fresh Greens — API Wrapper Module
 *
 * jQuery AJAX wrapper that automatically handles:
 * - Session cookies (JSESSIONID)
 * - CSRF tokens (from cookie)
 * - Error handling and toast notifications
 * - Loading states
 */
const FGApi = (function () {
    'use strict';

    const BASE_URL = '';

    /**
     * Read CSRF token from the XSRF-TOKEN cookie (set by Spring Security)
     */
    function _getCsrfToken() {
        const name = 'XSRF-TOKEN=';
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let c = cookies[i].trim();
            if (c.indexOf(name) === 0) {
                return decodeURIComponent(c.substring(name.length));
            }
        }
        return '';
    }

    /**
     * Core AJAX request handler
     */
    function request(method, url, data, options) {
        options = options || {};

        const ajaxConfig = {
            url: BASE_URL + url,
            method: method,
            contentType: 'application/json',
            xhrFields: { withCredentials: true }, // Send session cookie
            beforeSend: function (xhr) {
                // Attach CSRF token for state-changing requests
                if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
                    xhr.setRequestHeader('X-XSRF-TOKEN', _getCsrfToken());
                }
            }
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            ajaxConfig.data = JSON.stringify(data);
        }

        if (options.loading) {
            _showLoading(options.loadingTarget);
        }

        return $.ajax(ajaxConfig)
            .then(function (response) {
                if (options.loading) {
                    _hideLoading(options.loadingTarget);
                }
                return response;
            })
            .catch(function (xhr) {
                if (options.loading) {
                    _hideLoading(options.loadingTarget);
                }

                const errorMsg = xhr.responseJSON
                    ? xhr.responseJSON.message
                    : 'Something went wrong. Please try again.';

                if (xhr.status === 401) {
                    // Session expired — clear stale local data
                    localStorage.removeItem('fg_user');
                    // Only redirect if this wasn't a silent/background request
                    if (!options.silent && window.location.pathname !== '/login.html') {
                        FGToast.show('Session expired. Please login again.', 'warning');
                        setTimeout(function () {
                            window.location.href = '/login.html';
                        }, 1500);
                    }
                } else if (!options.silent) {
                    FGToast.show(errorMsg, 'danger');
                }

                throw { status: xhr.status, message: errorMsg };
            });
    }

    function get(url, options) { return request('GET', url, null, options); }
    function post(url, data, options) { return request('POST', url, data, options); }
    function put(url, data, options) { return request('PUT', url, data, options); }
    function del(url, options) { return request('DELETE', url, null, options); }

    function _showLoading(target) {
        if (target) {
            $(target).html('<div class="spinner-fg"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Loading...</span></div></div>');
        }
    }

    function _hideLoading(target) {
        if (target) {
            $(target).find('.spinner-fg').remove();
        }
    }

    return {
        get: get,
        post: post,
        put: put,
        del: del,
        request: request
    };
})();

/**
 * Toast Notification Utility
 */
const FGToast = (function () {
    'use strict';

    function show(message, type) {
        type = type || 'success';
        const iconMap = {
            success: 'bi-check-circle-fill',
            danger: 'bi-exclamation-triangle-fill',
            warning: 'bi-exclamation-circle-fill',
            info: 'bi-info-circle-fill'
        };

        const toastHTML = `
            <div class="toast-fg">
                <div class="toast show align-items-center text-bg-${type} border-0" role="alert">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="bi ${iconMap[type] || 'bi-info-circle-fill'} me-2"></i>
                            ${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            </div>`;

        const $toast = $(toastHTML).appendTo('body');
        setTimeout(function () {
            $toast.fadeOut(300, function () { $(this).remove(); });
        }, 4000);
    }

    return { show: show };
})();
