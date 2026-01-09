/**
 * Skeleton Loader Components
 * Sprint 4: Issue #46 - Enhanced UI
 * 
 * Reusable skeleton loaders for different content types.
 * Provides visual feedback during loading states.
 * 
 * Author: Team 15
 * Sprint: 4
 */

import React from 'react'
import './SkeletonLoader.css'

/**
 * Base Skeleton Component
 */
export function Skeleton({ className = '', width = '100%', height = '20px', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    />
  )
}

/**
 * Item Card Skeleton (for lost items)
 */
export function ItemCardSkeleton() {
  return (
    <div className="skeleton-item-card">
      <Skeleton height="200px" className="skeleton-item-image" />
      <div className="skeleton-item-content">
        <Skeleton height="24px" width="70%" style={{ marginBottom: '12px' }} />
        <Skeleton height="16px" width="50%" style={{ marginBottom: '8px' }} />
        <Skeleton height="16px" width="60%" style={{ marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Skeleton height="28px" width="80px" />
          <Skeleton height="28px" width="100px" />
        </div>
        <Skeleton height="40px" width="100%" />
      </div>
    </div>
  )
}

/**
 * Claim Card Skeleton
 */
export function ClaimCardSkeleton() {
  return (
    <div className="skeleton-claim-card">
      <div className="skeleton-claim-header">
        <Skeleton height="20px" width="100px" />
        <Skeleton height="24px" width="80px" />
      </div>
      <Skeleton height="18px" width="90%" style={{ marginBottom: '8px' }} />
      <Skeleton height="18px" width="70%" style={{ marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <Skeleton height="36px" width="100px" />
        <Skeleton height="36px" width="100px" />
      </div>
    </div>
  )
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="skeleton-table-row">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} style={{ padding: '16px' }}>
          <Skeleton height="18px" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Grid of Item Skeletons
 */
export function ItemGridSkeleton({ count = 6 }) {
  return (
    <div className="items-grid">
      {Array.from({ length: count }).map((_, index) => (
        <ItemCardSkeleton key={index} />
      ))}
    </div>
  )
}

/**
 * List of Claim Skeletons
 */
export function ClaimListSkeleton({ count = 3 }) {
  return (
    <div className="claims-list-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <ClaimCardSkeleton key={index} />
      ))}
    </div>
  )
}

/**
 * Analytics Card Skeleton
 */
export function AnalyticsCardSkeleton() {
  return (
    <div className="skeleton-analytics-card">
      <Skeleton height="48px" width="48px" style={{ marginBottom: '12px', borderRadius: '8px' }} />
      <Skeleton height="32px" width="60px" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="100px" />
    </div>
  )
}

/**
 * Chart Skeleton
 */
export function ChartSkeleton({ height = '300px' }) {
  return (
    <div className="skeleton-chart" style={{ height }}>
      <Skeleton height="100%" width="100%" />
    </div>
  )
}

export default Skeleton


