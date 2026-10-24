// Canonical metric quantities for identity comparison, not display or pricing.
// Keep decimal points inside the quantity token so 1.5 L cannot become 5 L.
export function normalizeProductQuantities(value) {
  return String(value ?? '').replace(/\b(\d+(?:[.,]\d+)?)\s*(millilit(?:er|re)s?|ml|lit(?:er|re)s?|l|kilograms?|kg|milligrams?|mg|grams?|g|millimet(?:er|re)s?|mm|centimet(?:er|re)s?|cm)\b/gi, (_, number, unit) => {
    unit = unit.toLowerCase();
    // A comma followed by three digits may be a thousands separator. Keep it
    // opaque rather than guessing which locale the publisher used.
    if (/\d,\d{3}$/.test(number)) return 'quantity' + number.replace(',', 'comma') + unit;
    let shift = 0, base;
    if (/^(ml|millilit)/.test(unit)) base = 'ml';
    else if (/^(l|lit)/.test(unit)) { base = 'ml'; shift = 3; }
    else if (/^(kg|kilogram)/.test(unit)) { base = 'mg'; shift = 6; }
    else if (/^(g|gram)/.test(unit)) { base = 'mg'; shift = 3; }
    else if (/^(mg|milligram)/.test(unit)) base = 'mg';
    else if (/^(cm|centimet)/.test(unit)) { base = 'mm'; shift = 1; }
    else base = 'mm';
    // Shift decimal strings exactly: rounding tiny quantities could make
    // distinct concentrations or doses appear identical.
    const [whole, fraction = ''] = number.replace(',', '.').split('.');
    const digits = whole + fraction.padEnd(shift, '0');
    const point = whole.length + shift;
    const integer = digits.slice(0, point).replace(/^0+(?=\d)/, '');
    const decimal = digits.slice(point).replace(/0+$/, '');
    return integer + (decimal ? 'p' + decimal : '') + base;
  });
}
