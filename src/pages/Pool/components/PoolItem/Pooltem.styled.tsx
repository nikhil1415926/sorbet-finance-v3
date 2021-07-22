import styled from 'styled-components'

export const PoolItemLayout = styled.div`
  background-color: ${({ theme }) => theme.bg7};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  padding: 0px 18px;
  &:hover {
    background-color: ${({ theme }) => theme.bgHover};
    border-color: ${({ theme }) => theme.borderHover};
  }
`;

export const PoolItemHeader = styled.div<{isCollapsed: boolean}>`
  padding: ${({isCollapsed}) => isCollapsed ? '21px 0px': '21px 0px 22px'}
  display: flex;
  justify-content: space-between;
  border-bottom: 0.5px solid ${({ theme, isCollapsed }) => !isCollapsed ? theme.border: 'none' };
`