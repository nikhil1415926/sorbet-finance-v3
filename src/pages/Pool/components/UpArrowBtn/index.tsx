import React from 'react'
import styled from 'styled-components'

const StyledSVG = styled.svg<{isUpArrow: boolean}>`
  margin-right: -10px;
  height: 40px;
  width: 40px;
  fill: transparent;
  path {
    stroke: #FFF;
  }
  transform: ${({ isUpArrow }) => isUpArrow ? 'rotate(90deg)' : 'rotate(270deg)' }; 
  &:hover {
    fill: #ffffff0E;
  }
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-right: -8px;
    width: 32px;
    height: 32px;
  `};
`

const UpArrowBtn = ({ 
  isUpArrow = true, 
  ...rest  
  }: { 
    isUpArrow? : boolean,
    [k: string]: any 
  }) => {
  return (
    <StyledSVG viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" isUpArrow={isUpArrow} {...rest}>
      <circle cx="20" cy="20" r="20" />
      <path d="M22.837 13.353L16 20.1899L22.837 27.0269" stroke="#525252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </StyledSVG>
  )
}


export default UpArrowBtn;