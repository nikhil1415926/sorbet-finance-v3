//import { useGUniFactoryContract } from 'hooks/useContract'
import React, {useState, useEffect} from 'react'
import PoolInfo from '../../components/PoolInfo';
import styled from "styled-components";
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

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

export const fetchPools = async () => {
  try {
    const APIURL = "https://api.thegraph.com/subgraphs/name/gelatodigital/g-uni";

    const obsQ = `
      query {
        pools {
          id
          blockCreated
          manager
          address
          uniswapPool
          positionId
          token0
          token1
          feeTier
          liquidity
          lowerTick
          upperTick
          totalSupply
          managerFee
          lastTouchWithoutFees
          supplySnapshots {
            id
            block
            reserves0
            reserves1
          }
          feeSnapshots {
            id
            block
            feesEarned0
            feesEarned1
          }
        }
      }
    `;
    
    const client = new ApolloClient({
      uri: APIURL,
      cache: new InMemoryCache()
    });
    
    const data = await client.query({
      query: gql(obsQ)
    })
    return data.data.pools;
  } catch(e) {
    console.log("error fetching pools for subgraph:", e)
    return []
  }
}

export default function ListPools() {
  const [poolsData, setPoolsData] = useState<any[]>([]);
  useEffect(() => {
    fetchPools().then((result) => {
      setPoolsData(result);
    });
  }, []);
  return (
    <Box>
      <Title>G-UNI Pools</Title>
      {poolsData.length > 0 ?
        <List>
            {poolsData.map(function(poolData, index){
                return <PoolInfo key={index} poolData={poolData} />;
              })}
        </List>
      :
        <></>
      }
    </Box>
  )
}
