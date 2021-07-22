import React from 'react';
import styled from 'styled-components'
import { ExternalLink } from 'theme'
import GelatoWhiteIcon from 'assets/svg/gelato_logo_white.svg'
import GelatoDarkIcon from 'assets/svg/gelato_logo_dark.svg'
import { useDarkModeManager } from 'state/user/hooks'
import { isMobile } from 'react-device-detect'

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 16px;
  padding: 24px 20px;
  width: 95vw;
  max-width: 500px;
  border-radius: 24px;
  background-color: ${({ theme }) => theme.bg0};
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
`;

export const PoweredByGelatoWrapper = styled.div`
  margin: 24px 0px 0px;
  text-align: center;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 120px 1fr;
    align-items: center;
    justify-content: center;
    width: '10px';
    height: '10px';
  `};
`

function PoweredByGelato() {
  const [isDarkMode] = useDarkModeManager()
  return isMobile ? null : (
    <ExternalLink href={'https://www.gelato.network/'}>
      <PoweredByGelatoWrapper>
        <img
          src={isDarkMode ? GelatoDarkIcon: GelatoWhiteIcon }
          alt={'powered by gelato'}
        />
      </PoweredByGelatoWrapper>
    </ExternalLink>
  )
}
interface LayoutProps {
  children? : React.ReactNode
}

const PoolLayout = ({ children }: LayoutProps) => (
  <LayoutWrapper>
    <div>
      { children && children }
    </div>
    <div>
      <PoweredByGelato/>
    </div>
  </LayoutWrapper>
) 

export default PoolLayout




