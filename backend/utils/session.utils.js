const UAParser = require('ua-parser-js');

/**
 * Parse le userAgent pour extraire device, browser, os
 */
function parseUserAgent(userAgentString) {
    if (!userAgentString) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };

    const parser = new UAParser(userAgentString);
    const result = parser.getResult();

    const browser = result.browser.name || 'Unknown';
    const os = result.os.name || 'Unknown';

    let device = 'Desktop';
    if (result.device.type === 'mobile') device = 'Mobile';
    else if (result.device.type === 'tablet') device = 'Tablet';

    return { device, browser, os };
}

/**
 * Extrait l'IP réelle depuis la requête (derrière nginx/proxy)
 */
function extractIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || null;
}

/**
 * Géolocalise une IP via ip-api.com (gratuit, 45 req/min)
 * Retourne "City, Country" ou null si échec
 */
async function getLocationFromIp(ip) {
    try {
        // Ignorer les IPs locales
        if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
            return 'Local';
        }

        const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`);
        const data = await response.json();

        if (data.status === 'success') {
            return `${data.city}, ${data.country}`;
        }
        return null;
    } catch (err) {
        console.warn('Geolocation failed for IP:', ip, err.message);
        return null;
    }
}

/**
 * Construit l'objet session complet à partir de req
 */
async function buildSessionInfo(req) {
    const userAgent = req.headers['user-agent'] || null;
    const ip = extractIp(req);
    const { device, browser, os } = parseUserAgent(userAgent);
    const location = await getLocationFromIp(ip);

    return { ipAddress: ip, userAgent, device, browser, os, location };
}

module.exports = { buildSessionInfo, parseUserAgent, extractIp, getLocationFromIp };