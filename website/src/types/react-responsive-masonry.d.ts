declare module 'react-responsive-masonry' {
  import React from 'react';
  
  interface ResponsiveMasonryProps {
    columnsCountBreakPoints?: Record<number, number>;
    children: React.ReactNode;
  }
  
  interface MasonryProps {
    columnsCount?: number;
    gutter?: string | number;
    children: React.ReactNode;
  }
  
  export default function Masonry(props: MasonryProps): JSX.Element;
  export function ResponsiveMasonry(props: ResponsiveMasonryProps): JSX.Element;
}
