export const FREIGHT_CLASSES = [
  '50', '55', '60', '65', '70', '77.5', '85', '92.5', '100', '110',
  '125', '150', '175', '200', '250', '300', '400', '500',
] as const

export type FreightClass = (typeof FREIGHT_CLASSES)[number]
