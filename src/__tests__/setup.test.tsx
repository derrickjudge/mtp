import React from 'react'
import { render, screen } from '@testing-library/react'

describe('Testing Setup', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true)
  })

  it('should have access to testing-library matchers', () => {
    render(<div>Hello World</div>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
}) 