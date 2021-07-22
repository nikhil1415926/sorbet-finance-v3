import React from 'react';
import { TYPE } from 'theme';
import { RowBetween } from 'components/Row';
import { AutoColumn } from 'components/Column';
import { PoolInfoBox } from './PoolOverView.styled';
import BackBtn from '../../components/BackBtn/BackBtn';

const PoolOverview : React.FC = () => {
  return (
    <>
      <BackBtn to='/pools' />
      <TYPE.heading1 mb={3} style={{textAlign: 'center'}}>USDC/DAI Pool Overview</TYPE.heading1>
      <PoolInfoBox>
        <AutoColumn 
          gap="18px"
          style={{padding: '25px 18px'}}
        >
          <RowBetween>
            <TYPE.heading4>Total Value ($)</TYPE.heading4>
            <TYPE.heading3>$ 567,657,678.88</TYPE.heading3>
          </RowBetween>
          <RowBetween>
            <TYPE.heading4>APY</TYPE.heading4>
            <TYPE.heading3>5%</TYPE.heading3>
          </RowBetween>
          <RowBetween>
            <TYPE.heading4>Fees earned in past 7 days</TYPE.heading4>
            <TYPE.heading3>$ 2,894.67</TYPE.heading3>
          </RowBetween>
        </AutoColumn>
      </PoolInfoBox>
    </>
  )
};

export default PoolOverview;