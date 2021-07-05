import React, {useEffect, useState} from 'react';
import {useTokenContract, useGUniPoolContract} from 'hooks/useContract';
import { useActiveWeb3React } from 'hooks/web3';
import {ethers} from 'ethers';
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'

export type PoolTokens = {
  token0: string;
  token1: string;
}

export type PoolParams  = {
  pool: Contract;
  token0: string;
  token1: string
}

export type PoolDetails = {
  name: string;
  symbol: string;
  symbol0: string;
  symbol1: string;
  decimals: number;
  decimals0: number;
  decimals1: number;
  supply: BigNumber;
  supply0: BigNumber;
  supply1: BigNumber;
  balancePool: BigNumber;
  balance0: BigNumber;
  balance1: BigNumber;
  balanceEth: BigNumber;
  share0: BigNumber;
  share1: BigNumber;
}

type AddressParam = {
  address: string;
}

export const formatBigNumber = (n: BigNumber, decimals: number, roundTo = 4): string => {
  const str = ethers.utils.formatUnits(n, decimals.toString());
  return Number(str).toFixed(roundTo);
}

export const fetchPoolDetails = async (guniPool: Contract, token0: Contract, token1 : Contract, account : string|undefined|null) :Promise<PoolDetails|null> => {
  if (guniPool && token0 && token1) {
    let balancePool = ethers.constants.Zero;
    let balance0 = ethers.constants.Zero;
    let balance1 = ethers.constants.Zero;
    let balanceEth = ethers.constants.Zero;
    const name = await guniPool.name();
    const gross = await guniPool.getUnderlyingBalances();
    const supply = await guniPool.totalSupply();
    const decimals0 = await token0.decimals();
    const decimals1 = await token1.decimals();
    const symbol0 = await token0.symbol();
    const symbol1 = await token1.symbol();
    if (account) {
      balancePool = await guniPool.balanceOf(account);
      balance0 = await token0.balanceOf(account);
      balance1 = await token1.balanceOf(account);
      balanceEth = await guniPool.provider.getBalance(account);
    }
    const share0 = gross[0].mul(balancePool).div(supply);
    const share1 = gross[1].mul(balancePool).div(supply);
    return {
      name: name,
      symbol: "G-UNI",
      symbol0: symbol0,
      symbol1: symbol1,
      decimals: 18,
      decimals0: Number(decimals0),
      decimals1: Number(decimals1),
      supply: supply,
      supply0: gross[0],
      supply1: gross[1],
      balancePool: balancePool,
      balance0: balance0,
      balance1: balance1,
      balanceEth: balanceEth,
      share0: share0,
      share1: share1
    }
  }

  return null;
}

function PoolDetails(props: PoolParams) {
  const [poolDetails, setPoolDetails] = useState<PoolDetails|null>(null);
  const {chainId, account} = useActiveWeb3React();
  const guniPool = props.pool;
  const token0 = useTokenContract(props.token0);
  const token1 = useTokenContract(props.token1);
  useEffect(() => {
    const getPoolDetails = async () => {
      if (guniPool && token0 && token1) {
        const details = await fetchPoolDetails(guniPool, token0, token1, account);
        setPoolDetails(details);
      }
    }
    getPoolDetails();
  }, [guniPool, token0, token1, account, chainId]);
  return (
    <>
      {poolDetails ? 
        <>
          <h1>{poolDetails.name}</h1>
          <p>
            <strong>TVL:</strong>
            {` ${formatBigNumber(poolDetails.supply0, poolDetails.decimals0, 2)} ${poolDetails.symbol0} and ${formatBigNumber(poolDetails.supply1, poolDetails.decimals1, 2)} ${poolDetails.symbol1} `}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <strong>Supply:</strong>
            {` ${formatBigNumber(poolDetails.supply, poolDetails.decimals, 4)} G-UNI`}
          </p>
          {poolDetails.balancePool.gt(0) ? <p><strong>Your Share:</strong>{` ${formatBigNumber(poolDetails.balancePool, poolDetails.decimals, 4)} G-UNI`}</p>:<></>}
          {poolDetails.balancePool.gt(0) ? <p><strong>Your Share Value:</strong>{` ${formatBigNumber(poolDetails.share0, poolDetails.decimals0, 2)} ${poolDetails.symbol0} and ${formatBigNumber(poolDetails.share1, poolDetails.decimals1, 2)} ${poolDetails.symbol1}`}</p>:<></>}
          <p>
            <a href={`/#/pools/add/${guniPool.address}`}>Add Liquidity</a>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {poolDetails.balancePool.gt(0) ? <a href={`/#/pools/remove/${guniPool.address}`}>Remove Liquidity</a>:<></>}
          </p>
        </>
      :
        <></>
      }
    </>
  )
}

export default function PoolInfo(props: AddressParam) {
  const [poolTokens, setPoolTokens] = useState<PoolTokens|null>(null);
  const [pool, setPool] = useState<Contract>();
  const {chainId} = useActiveWeb3React();
  const guniPool = useGUniPoolContract(props.address);
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
      {pool && poolTokens ? <PoolDetails pool={pool} token0={poolTokens.token0} token1={poolTokens.token1} /> : <></>}
    </>
  )
}