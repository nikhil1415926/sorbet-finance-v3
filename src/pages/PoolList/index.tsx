import React from 'react'
import PoolInfo from '../../components/PoolInfo';
import { useGUniFactoryContract } from 'hooks/useContract'
import usePromise from 'hooks/usePromise';
import { Box, Title, List } from './styled';

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
    return <p> Loading Now ...</p>
  } else if(ERROR_STATUS) {
    console.log(error);
    return <p>Issue occured while fetching</p>
  } else {
    return (
      <List>
        {data && data.map((pool, index) => (
          <PoolInfo key={index} address={pool} />
        ))}
      </List>
    )  
  }
}

const PoolListContainer = () => {
  return (
    <Box>
      <Title>G-UNI Pools</Title>
      <PoolList />
    </Box>
  )
}

export default PoolListContainer;
