import React from 'react'
import { TYPE } from 'theme'
import { RowBetween } from 'components/Row'
import { AutoColumn } from 'components/Column'
import BackBtn from '../../components/BackBtn'
import ShowPoolStatus from '../../components/ShowPoolStatus'
import { ButtonMedium } from 'components/Button';

const RemoveLiquidity: React.FC = () => {
  return (
    <>
      <BackBtn to='/pools/Ox23123' />
      <TYPE.heading1 mb={3} style={{textAlign: 'center'}}>
        Remove Liquidity to DAI/USDC LP
      </TYPE.heading1>
    </>
  )
};

export default RemoveLiquidity;