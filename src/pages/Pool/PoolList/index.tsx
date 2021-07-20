import React from 'react'
import { useGUniFactoryContract } from 'hooks/useContract'
import usePromise from 'hooks/usePromise'
import { TYPE, GlobalLink } from 'theme'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader';
import PoolLayout from '../components/PoolLayout'
import PoolItem from '../components/PoolItem'

export type PoolParam = {
  address: string;
}

const PoolList: React.FC = () => {
  const guniFactory = useGUniFactoryContract();
  const { status, data, error } = usePromise<PoolParam[]>(
    () => guniFactory && guniFactory.getGelatoPools(), [guniFactory]);

  const LOADING_STATUS = status === 'pending' || status === 'init';
  const ERROR_STATUS = status === 'rejected';

  if(LOADING_STATUS) {
    return (
      <div style={{marginTop: '48px', textAlign: 'center'}}>
        <Loader size="180px"/>
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
    <PoolLayout>
      <TYPE.heading1 mb={3}>G-UNI Pools</TYPE.heading1>
      <TYPE.description>
        Automated Liquidity Provision Management on Uniswap v3. 
        More info&nbsp; 
       <GlobalLink href={'https://google.com'}>here</GlobalLink>
       <PoolList/>
      </TYPE.description>
    </PoolLayout>
  )
}

export default PoolListContainer;
