import React from 'react'
import { Link, LinkProps } from 'react-router-dom';
import styled from 'styled-components'

const StyledSVG = styled.svg`
  height: 18px;
  width: 18px;
  path {
    stroke: ${({ stroke, theme }) => stroke ?? theme.backIcon};
  }
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 16px;
    height: 16px;
  `};
  &:hover {
    background-color: #F00;
  }
`

const BackIcon = () => {
  return (
    <StyledSVG viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M12 1L3 12L12 23"
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </StyledSVG>
  )
}

const StyledLink = styled(Link)`
  position: absolute;
  margin-left: 10px;
  
`
const BackBtn = (props: LinkProps) => (
  <StyledLink {...props}>
    <BackIcon />
  </StyledLink>
);

export default BackBtn;