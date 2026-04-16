import { render, screen } from '@testing-library/react'
import HeaderBox from '@/components/HeaderBox' 
import { describe, it, expect } from 'vitest'

describe('HeaderBox Component', () => {
  it('renders title and user name correctly', () => {
    render(
      <HeaderBox 
        type="greeting" 
        title="Welcome" 
        user="Guest" 
        subtext="Access your account" 
      />
    )

    
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Guest')).toBeInTheDocument()
  })
})