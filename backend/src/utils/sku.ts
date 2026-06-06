/**
 * Generates an inventory SKU based on product characteristics
 * Example: Helmet -> HLMT, Brand: Arai -> ARA, Name: Corsair -> COR, Color: Black -> BLK, Size: L -> L
 * Output: HLMT-ARA-COR-BLK-L
 */
export const generateSKU = (
  categoryName: string,
  brand: string,
  productName: string,
  color: string,
  size: string
): string => {
  // Map category to a 4-letter prefix
  let catPrefix = 'GEAR';
  const cat = categoryName.toLowerCase();
  if (cat.includes('helmet')) catPrefix = 'HLMT';
  else if (cat.includes('jacket')) catPrefix = 'JKT';
  else if (cat.includes('glove')) catPrefix = 'GLV';
  else if (cat.includes('pant')) catPrefix = 'PNT';
  else if (cat.includes('boot')) catPrefix = 'BMS';
  else if (cat.includes('rain')) catPrefix = 'RAIN';
  else if (cat.includes('bag') || cat.includes('luggage') || cat.includes('saddle')) catPrefix = 'LUGG';
  else if (cat.includes('access')) catPrefix = 'ACC';

  const formatSegment = (str: string, len: number): string => {
    return str
      .replace(/[^a-zA-Z0-9]/g, '') // remove non-alphanumeric
      .toUpperCase()
      .slice(0, len)
      .padEnd(len, 'X');
  };

  const brandCode = formatSegment(brand, 3);
  const nameCode = formatSegment(productName, 3);
  const colorCode = formatSegment(color, 3);
  const sizeCode = size.toUpperCase().replace('-', '');

  return `${catPrefix}-${brandCode}-${nameCode}-${colorCode}-${sizeCode}`;
};
