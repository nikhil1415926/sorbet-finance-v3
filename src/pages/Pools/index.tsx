import { useGUniFactoryContract } from 'hooks/useContract'
import React, {useState, useEffect} from 'react'
import PoolInfo from '../../components/PoolInfo';

export type PoolParam = {
  address: string;
}

export default function ListPools() {
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
    <>
      <p>Gelato Uniswap V3 Pools</p>
      {pools.length > 0 ?
        <ul>
            {pools.map(function(pool, index){
                return <PoolInfo key={index} address={pool.address} />;
              })}
        </ul>
      :
        <></>
      }
    </>
  )
}
