document.addEventListener("DOMContentLoaded", function () {
    const consentBanner = document.getElementById("cookie-consent-banner");
    const agreeButton = document.getElementById("agree-button");
    const disagreeButton = document.getElementById("disagree-button");

    agreeButton.addEventListener("click", function () {
        setCookie("cookieConsent", "true", 365);
        consentBanner.style.display = "none";
        loadGoogleAnalytics();
    });

    disagreeButton.addEventListener("click", function () {
        setCookie("cookieConsent", "false", 365);
        consentBanner.style.display = "none";
    });

    if (getCookie("cookieConsent") === "true") {
        loadGoogleAnalytics();
        consentBanner.style.display = "none";
    } else if (getCookie("cookieConsent") === "false") {
        consentBanner.style.display = "none";
    }

    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === " ") c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function loadGoogleAnalytics() {
        (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
            var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s),
                dl = l != "dataLayer" ? "&l=" + l : "";
            j.async = true;
            j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, "script", "dataLayer", "GTM-TPQ5CVKL");

        // Add the noscript iframe dynamically
        const noscript = document.createElement("noscript");
        const iframe = document.createElement("iframe");
        iframe.src = "https://www.googletagmanager.com/ns.html?id=GTM-TPQ5CVKL";
        iframe.height = "0";
        iframe.width = "0";
        iframe.style.display = "none";
        iframe.style.visibility = "hidden";
        noscript.appendChild(iframe);
        document.body.appendChild(noscript);

        console.log("Google Analytics loaded");
    }
});