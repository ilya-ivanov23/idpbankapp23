import { formatAmount } from '@/lib/utils' 
import { describe, it, expect } from 'vitest'

describe('formatAmount Utility', () => {
  it('should format positive numbers correctly', () => {
    const result = formatAmount(1236010.00)
    expect(result).toBe('$1,236,010.00') 
  })

  it('should handle zero', () => {
    const result = formatAmount(0)
    expect(result).toBe('$0.00')
  })
})