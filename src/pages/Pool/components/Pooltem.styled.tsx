import styled from 'styled-components'
import { ButtonPink } from 'components/Button'

export const PoolItemLayout = styled.div`
  background-color: ${({ theme }) => theme.bg7};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  padding: 11px 18px;
`;

export const PoolItemHeader = styled.div<{isCollapsed: boolean}>`
  padding: ${({isCollapsed}) => isCollapsed ? '0px 0px': '10px 0px'}
  display: flex;
  justify-content: space-between;
`

export const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
`

export const ButtonSmall = styled(ButtonPink)`
  padding-top: 2px;
  padding-bottom: 3px;
  width: 97px;
  font-weight: 600;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 13px;
  `}
`;