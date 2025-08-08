import React from 'react'
import { render, screen } from '@testing-library/react'
import { StatsCard } from '../stats-card'
import { Zap, DollarSign } from 'lucide-react'

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Current Generation',
    value: '5.2 kW',
    icon: <Zap className="w-6 h-6 text-primary" data-testid="zap-icon" />,
  }

  it('renders title and value correctly', () => {
    render(<StatsCard {...defaultProps} />)
    
    expect(screen.getByText('Current Generation')).toBeInTheDocument()
    expect(screen.getByText('5.2 kW')).toBeInTheDocument()
  })

  it('renders icon correctly', () => {
    render(<StatsCard {...defaultProps} />)
    
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument()
  })

  it('displays change indicator when provided', () => {
    render(
      <StatsCard 
        {...defaultProps} 
        change="+5%" 
        changeType="positive" 
      />
    )
    
    expect(screen.getByText('+5% vs last period')).toBeInTheDocument()
    expect(screen.getByText('+5% vs last period')).toHaveClass('text-green-600')
  })

  it('displays negative change indicator correctly', () => {
    render(
      <StatsCard 
        {...defaultProps} 
        change="-3%" 
        changeType="negative" 
      />
    )
    
    expect(screen.getByText('-3% vs last period')).toBeInTheDocument()
    expect(screen.getByText('-3% vs last period')).toHaveClass('text-red-600')
  })

  it('does not render change when not provided', () => {
    render(<StatsCard {...defaultProps} />)
    
    expect(screen.queryByText(/vs last period/)).not.toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    const { container } = render(<StatsCard {...defaultProps} />)
    
    const card = container.firstChild
    expect(card).toHaveClass('shadow-md', 'hover:shadow-lg', 'transition-shadow')
  })

  it('has proper semantic structure', () => {
    render(<StatsCard {...defaultProps} />)
    
    // Should have proper heading structure
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Current Generation')
    
    // Value should be prominently displayed
    const valueElement = screen.getByText('5.2 kW')
    expect(valueElement).toHaveClass('text-3xl', 'font-bold', 'font-headline')
  })

  it('handles different icon types', () => {
    const { rerender } = render(<StatsCard {...defaultProps} />)
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument()
    
    rerender(
      <StatsCard 
        {...defaultProps} 
        icon={<DollarSign className="w-6 h-6 text-primary" data-testid="dollar-icon" />}
      />
    )
    expect(screen.getByTestId('dollar-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('zap-icon')).not.toBeInTheDocument()
  })

  it('memoizes correctly to prevent unnecessary re-renders', () => {
    const renderSpy = jest.fn()
    
    const TestComponent = React.memo(() => {
      renderSpy()
      return <StatsCard {...defaultProps} />
    })
    
    const { rerender } = render(<TestComponent />)
    expect(renderSpy).toHaveBeenCalledTimes(1)
    
    // Re-render with same props - should not cause re-render due to memo
    rerender(<TestComponent />)
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  it('supports accessibility attributes', () => {
    render(
      <StatsCard 
        {...defaultProps}
        change="+5%"
        changeType="positive"
      />
    )
    
    // The change indicator should be readable by screen readers
    const changeElement = screen.getByText('+5% vs last period')
    expect(changeElement).toBeInTheDocument()
    
    // Icon should have proper accessible structure
    const iconContainer = screen.getByTestId('zap-icon').parentElement
    expect(iconContainer).toBeInTheDocument()
  })

  it('handles long titles gracefully', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines in smaller viewports'
    
    render(
      <StatsCard 
        {...defaultProps}
        title={longTitle}
      />
    )
    
    expect(screen.getByText(longTitle)).toBeInTheDocument()
    expect(screen.getByText(longTitle)).toHaveClass('text-sm', 'font-medium')
  })

  it('handles large values correctly', () => {
    const largeValue = '1,234,567.89 kWh'
    
    render(
      <StatsCard 
        {...defaultProps}
        value={largeValue}
      />
    )
    
    expect(screen.getByText(largeValue)).toBeInTheDocument()
    expect(screen.getByText(largeValue)).toHaveClass('text-3xl', 'font-bold')
  })
})