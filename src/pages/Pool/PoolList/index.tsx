import React from 'react'
import { useGUniFactoryContract } from 'hooks/useContract'
import usePromise from 'hooks/usePromise'
import { TYPE, GlobalLink } from 'theme'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader';
import PoolItem from '../components/PoolItem'
import { PoolPtr } from '../pool'

const PoolList: React.FC = () => {
  const guniFactory = useGUniFactoryContract();
  const { status, data, error } = usePromise<PoolPtr[]>(
    () => guniFactory && guniFactory.getGelatoPools(), [guniFactory]);

  const LOADING_STATUS = status === 'pending' || status === 'init';
  const ERROR_STATUS = status === 'rejected';

  if(LOADING_STATUS) {
    return (
      <div style={{margin: '36px 0 24px', textAlign: 'center'}}>
        <Loader size="180px" strokeWidth={1} />
      </div>
    )
  } else if(ERROR_STATUS) {
    console.log(error);
    return <p>Issue occured while fetching</p>
  } else {
    return (
      <AutoColumn gap="md" style={{marginTop: '24px'}}>
        <PoolItem
          token0={'ETH'}
          token1={'ETH'}
        />
        <PoolItem
          token0={'ETH'}
          token1={'ETH'}
        />
      </AutoColumn>
    )  
  }
}

const PoolListContainer = () => {
  return (
    <>
      <TYPE.heading1 mb={3}>G-UNI Pools</TYPE.heading1>
      <TYPE.description>
        Automated Liquidity Provision Management on Uniswap v3. 
        More info&nbsp; 
       <GlobalLink href={'https://google.com'}>here</GlobalLink>
      </TYPE.description>
      <PoolList/>
    </>
  )
}

export default PoolListContainer;
