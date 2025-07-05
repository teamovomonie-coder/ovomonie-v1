'use client'
import NextLink, { type LinkProps } from 'next/link'
import React from 'react'
import NProgress from 'nprogress'

const CustomLink = React.forwardRef<HTMLAnchorElement, LinkProps & { children: React.ReactNode }>(({ href, onClick, ...rest }, ref) => {
  const isExternal = href.toString().startsWith('http');
  const isAnchor = href.toString().startsWith('#');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isExternal && !isAnchor) {
      NProgress.start();
    }
    if (onClick) {
      onClick(e);
    }
  }

  return <NextLink href={href} onClick={handleClick} {...rest} ref={ref} />
})

CustomLink.displayName = 'CustomLink'
export default CustomLink;
