import styled from 'styled-components';

export const PoolInfoBox = styled.div`
  margin-top: 40px;
  border-top: 0.5px solid ${({ theme }) => theme.border };
`;

export const Img = styled.img`
  margin-left: 20px;
  margin-right: 35px;
  width: 26px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 22px;
    margin-right: 25px;
  `};
`

export const FixedSpan = styled.span`
  width: 160px;
  text-align: left;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 140px;
  `};
`