import React from 'react'
import { Link, LinkProps } from 'react-router-dom';
import styled from 'styled-components'

const StyledSVG = styled.svg`
  height: 40px;
  width: 40px;
  fill: ${({ theme }) => theme.bg0 };
  path {
    stroke: ${({ stroke, theme }) => stroke ?? theme.backIcon};
  }
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 32px;
    height: 32px;
  `};

  &:hover {
    fill: ${({ theme }) => theme.iconHover };
  }
`

const BackIcon = () => {
  return (
    <StyledSVG viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" />
      <path d="M22.837 13.353L16 20.1899L22.837 27.0269" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </StyledSVG>
  )
}

const StyledLink = styled(Link)`
  position: absolute;
  margin-left: 4px;
  margin-top: -9.5px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 16px;
    height: 16px;
    margin-top: -7.5px;
    margin-left: 6px;
`};
`
const BackBtn = (props: LinkProps) => (
  <StyledLink {...props}>
    <BackIcon />
  </StyledLink>
);

export default BackBtn;