import React, { useState, useEffect } from 'react'
import type { FC } from 'react';
import { useGUniFactoryContract } from 'hooks/useContract'
import PoolInfo from '../../components/PoolInfo';
import { Box, Title, List } from './styled';

export type PoolParam = {
  address: string;
}

const PoolList: FC = () => {
  const [pools, setPools] = useState<PoolParam[]>([]);
  const guniFactory = useGUniFactoryContract();
  useEffect(() => {
    const getPools = async () => {
      if (guniFactory) {
        const r = await guniFactory.getGelatoPools();
        const foundPools = [];
        for (let i=0; i<r.length; i++) {
          foundPools.push({address: r[i]});
        }
        setPools(foundPools);
      }
    }
    getPools();
  }, [guniFactory]);
  return (
    <Box>
      <Title>G-UNI Pools</Title>
      {pools.length > 0 ?
        <List>
            {pools.map(function(pool, index){
                return <PoolInfo key={index} address={pool.address} />;
              })}
        </List>
      :
        <></>
      }
    </Box>
  )
}

export default PoolList;
