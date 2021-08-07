import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, AppState } from '../index';
import { PoolInfo } from './reducer';
import { setPool } from './actions';

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
    //console.log(data.data.pools);
    return data.data.pools;
  } catch(e) {
    console.log("error fetching pools for subgraph:", e)
    return []
  }
}

export function usePool(): [Array<PoolInfo>, (poolsData: Array<PoolInfo>) => void] {
  const poolsData = useSelector<AppState, AppState['pool']['pools']>((state) => state.pool.pools);
  const dispatch = useDispatch<AppDispatch>();
  const setPoolsData = useCallback((data: Array<PoolInfo>) => {
    dispatch(setPool({ pools: data }))
  }, [dispatch]);
  return [poolsData, setPoolsData];
}