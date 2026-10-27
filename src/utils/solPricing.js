/* global BigInt */
// Validate decimal precision before converting form values to API numbers.
export function decimalUnits(value, decimals) {
    if (!['string', 'number'].includes(typeof value) || String(value).length > 100) return null;
    const match = String(value).trim().match(/^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);
    if (!match) return null;
    const shift = decimals + Number(match[3] || 0) - (match[2] || '').length;
    if (Math.abs(shift) > 100) return null;
    let result = BigInt(match[1] + (match[2] || ''));
    if (shift < 0) {
        const divisor = BigInt(10) ** BigInt(-shift);
        if (result % divisor) return null;
        result /= divisor;
    } else result *= BigInt(10) ** BigInt(shift);
    return result <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(result) : null;
}

export function validateSolTerms(settings) {
    const rate = decimalUnits(settings.tokensPerSol, 6);
    const minimum = decimalUnits(settings.minPurchaseSol, 9);
    const maximum = decimalUnits(settings.maxPurchaseSol, 9);
    if (rate === null) return 'FP per SOL must be non-negative with at most 6 decimal places.';
    if (minimum === null || maximum === null) return 'SOL limits must be non-negative with at most 9 decimal places.';
    if (minimum > maximum) return 'Minimum SOL purchase cannot exceed maximum SOL purchase.';
    if (settings.solPurchasesEnabled && (!rate || !minimum || !maximum)) return 'Set a positive FP per SOL rate and SOL purchase limits before enabling purchases.';
    return '';
}

export function validateItemSolPrice(value) {
    if (value === '' || value === null) return '';
    const amount = decimalUnits(value, 9);
    return amount === null || amount <= 0 ? 'SOL price must be positive with at most 9 decimal places, or blank to disable SOL purchases.' : '';
}
