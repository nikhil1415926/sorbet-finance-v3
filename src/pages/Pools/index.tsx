import { useGUniFactoryContract } from 'hooks/useContract'
import React, {useState, useEffect} from 'react'
import PoolInfo from '../../components/PoolInfo';
import styled from "styled-components";

export type PoolParam = {
  address: string;
}

export const Box = styled.div`
  dispaly: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #191B1F;
  border-radius: 1.5rem;
  min-width: 500px;
`;

export const Title = styled.p`
  font-weight: 800;
  margin-left: 5%;
`;

const List = styled.ul`
  margin: 1rem;
  padding: 0 0.25rem 0.25rem 0.25rem;
`;

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
