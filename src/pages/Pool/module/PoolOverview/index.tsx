import React from 'react'
import { TYPE } from 'theme'
import { RowBetween } from 'components/Row'
import { AutoColumn } from 'components/Column'
import { PoolInfoBox, Img, FixedSpan } from './PoolOverView.styled'
import BackBtn from '../../components/BackBtn'
import ShowPoolStatus from '../../components/ShowPoolStatus'
import { ButtonMedium } from 'components/Button';
import ImageAddLiquidity from  '../../../../assets/svg/add_liquidity.svg';
import ImageRemoveLiquidity from '../../../../assets/svg/remove_liquidity.svg';

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
      <ShowPoolStatus/>
      <AutoColumn 
        gap="18px"
        style={{padding: '0px 18px', marginTop: '35px'}}
      >
        <RowBetween>
          <TYPE.heading4>Your Pool Position</TYPE.heading4>
          <TYPE.heading3>$ 10,000</TYPE.heading3>
        </RowBetween>
        <RowBetween>
          <TYPE.heading4>Your Wallet Balance</TYPE.heading4>
          <TYPE.heading3>2,500 USDC / 2,500 DAI</TYPE.heading3>
        </RowBetween>
      </AutoColumn>
      <AutoColumn gap="20px" style={{marginTop: '25px'}}>
        <ButtonMedium>
          <Img src={ImageAddLiquidity}  />
          <FixedSpan>Add Liquidity</FixedSpan>
        </ButtonMedium>
        <ButtonMedium>
          <Img src={ImageRemoveLiquidity} />
          <FixedSpan>Remove Liquidity</FixedSpan>
        </ButtonMedium>
      </AutoColumn>
    </>
  )
};

export default PoolOverview;