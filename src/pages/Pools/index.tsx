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
  background-color: ${({ theme }) => theme.bg0};
  border-radius: 1.5rem;
  min-width: 500px;
  box-shadow: rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px;
  @media only screen and (max-width: 500px) {
    min-width: 300px;
    width: 100%;
  }
`;

export const Title = styled.p`
  font-weight: 800;
  margin-left: 5%;
`;

const List = styled.ul`
  margin: 1rem;
  padding: 0 0.25rem 0.25rem 0.25rem;
  @media only screen and (max-width: 500px) {
    padding: 0 0.05rem 0.05rem 0.05rem;
  }
`;

export default function ListPools() {
  const [pools, setPools] = useState<PoolParam[]>([]);
  const guniFactory = useGUniFactoryContract();
  useEffect(() => {
    const getPools = async () => {
      if (guniFactory) {
        const deployers = await guniFactory.getDeployers();
        const foundPools = [];
        for (let i=0; i<deployers.length; i++) {
          const pools = await guniFactory.getPools(deployers[i])
          for (let j=0; j< pools.length; j++) {
            foundPools.push({address: pools[j]});
          }
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
