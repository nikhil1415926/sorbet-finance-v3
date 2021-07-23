import React from 'react'
import { TYPE } from 'theme'
import { RowBetween } from 'components/Row'
import { AutoColumn } from 'components/Column'
import BackBtn from '../../components/BackBtn'
import ShowPoolStatus from '../../components/ShowPoolStatus'
import { ButtonMedium } from 'components/Button';
import AddLiquidtyPanel from './AddLiquidity';

import { PoolInfoBox } from './AddLiquidity.styled';

const AddLiquidity: React.FC = () => {
  return (
    <>
      <BackBtn to='/pools/Ox23123' />
      <TYPE.heading1 mb={3} style={{textAlign: 'center'}}>
        Add Liquidity to DAI/USDC LP
      </TYPE.heading1>
      <PoolInfoBox>
        <AutoColumn gap="18px" style={{padding: '25px 18px 15px 18px'}}>
          <RowBetween>
            <TYPE.heading4>Your Current Position</TYPE.heading4>
            <TYPE.heading3>$ 10,000</TYPE.heading3>
          </RowBetween>
          <RowBetween>
            <TYPE.heading4>Deposit</TYPE.heading4>
          </RowBetween>
        </AutoColumn>
      </PoolInfoBox>
      <AddLiquidtyPanel />
    </>
  )
};

export default AddLiquidity;