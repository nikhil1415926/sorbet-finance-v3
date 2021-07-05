import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {PoolDetails, PoolParams, PoolTokens, fetchPoolDetails} from '../../components/PoolInfo';
import {useTokenContract, useGUniPoolContract} from 'hooks/useContract';
import { useActiveWeb3React } from 'hooks/web3';
import { Contract } from '@ethersproject/contracts'
//import {ethers} from 'ethers';

function RemoveLiquidityPanel(props: PoolParams) {
  const [poolDetails, setPoolDetails] = useState<PoolDetails|null>();
  const {chainId, account} = useActiveWeb3React();
  const guniPool = props.pool;
  const token0 = useTokenContract(props.token0);
  const token1 = useTokenContract(props.token1);
  useEffect(() => {
    const getPool = async () => {
      if (guniPool && token0 && token1) {
        const details = await fetchPoolDetails(guniPool, token0, token1, account);
        setPoolDetails(details);
      }
    }
    getPool();
  }, [guniPool, token0, token1, account, chainId]);
  return (
    <>
      {poolDetails ?
        <>
          <p>{poolDetails.name}</p>
        </>
      :
        <></>
      }
    </>
  )
}

type PoolParam = {
  poolAddress: string;
}

export default function RemoveLiquidity() {
  const params = useParams() as PoolParam;
  const [poolTokens, setPoolTokens] = useState<PoolTokens|null>();
  const [pool, setPool] = useState<Contract>();
  const {chainId} = useActiveWeb3React();
  const guniPool = useGUniPoolContract(params.poolAddress);
  useEffect(() => {
    const getPoolInfo = async () => {
      if (guniPool) {
        const token0 = await guniPool.token0();
        const token1 = await guniPool.token1();
        setPoolTokens({token0: token0, token1: token1});
        setPool(guniPool);
      }
    }
    getPoolInfo();
  }, [guniPool, chainId]);
  return (
    <>
      {pool && poolTokens ? <RemoveLiquidityPanel pool={pool} token0={poolTokens.token0} token1={poolTokens.token1} /> : <></>}
    </>
  )
}
