import styled from 'styled-components'
import { ButtonPink } from 'components/Button'

export const PoolItemLayout = styled.div`
  background-color: ${({ theme }) => theme.bg7};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  padding: 0px 16px;
`;

export const PoolItemHeader = styled.div<{isCollapsed: boolean}>`
  padding: ${({isCollapsed}) => isCollapsed ? '11px 0px': '11px 0px 12px'}
  display: flex;
  justify-content: space-between;
  border-bottom: 0.5px solid ${({ theme, isCollapsed }) => !isCollapsed ? theme.border: 'none' };
`