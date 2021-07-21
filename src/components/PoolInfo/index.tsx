import React, {useEffect, useState} from 'react';
import {useTokenContract, useGUniPoolContract} from 'hooks/useContract';
import { useActiveWeb3React } from 'hooks/web3';
import {ethers} from 'ethers';
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import styled from "styled-components";
import { useCurrency } from 'hooks/Tokens'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { ButtonPink } from 'components/Button'
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const TWO = BigNumber.from(2);
const subgraphMap : { [key:string]:string; } = {};
subgraphMap['0xAbDDAfB225e10B90D798bB8A886238Fb835e2053'] = 'superarius/guni-usdc-dai'

export type PoolTokens = {
  token0: string
  token1: string
}

export type PoolParams  = {
  pool: Contract
  token0: string
  token1: string
}

export type PoolDetails = {
  name: string
  symbol: string
  symbol0: string
  symbol1: string
  decimals: number
  decimals0: number
  decimals1: number
  supply: BigNumber
  supply0: BigNumber
  supply1: BigNumber
  balancePool: BigNumber
  balance0: BigNumber
  balance1: BigNumber
  balanceEth: BigNumber
  share0: BigNumber
  share1: BigNumber
  apy: number
  sqrtPriceX96: BigNumber
}

export type APYDetails = {
  baseLiquidity: BigNumber
  timeDelta: number
}

type AddressParam = {
  address: string;
}

export const formatBigNumber = (n: BigNumber, decimals: number, roundTo = 3): string => {
  const str = ethers.utils.formatUnits(n, decimals.toString());
  if (!str.includes(".")) {
    return str
  }
  const sides = str.split(".");
  const start = sides[0];
  const end = sides[1];
  if (end.length < roundTo) {
    return str
  }
  return start + "." + end.substring(0, roundTo)
}

const ButtonSmall = styled(ButtonPink)`
  width: 15%;
  margin-right: 1rem;
  padding-top: 0.03rem;
  padding-bottom: 0.03rem;
  @media only screen and (max-width: 500px) {
    width: 20%;
  }
`;

const ButtonMedium = styled(ButtonPink)`
  width: 40%;
  @media only screen and (max-width: 500px) {
    width: 33%;
  }
`;

export const InnerBox = styled.div`
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 0.5rem;
  border: 1px solid #7d7f7c;
  @media only screen and (max-width: 500px) {
    font-size: 0.9rem;
  }
`;

const TitleArea = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ButtonsArea = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const Title = styled.p`
  margin-left: 1rem;
  font-weight: 800;
  font-size: 1.2rem;
  @media only screen and (max-width: 500px) {
    font-size: 1.1rem;
  }
`;

export const LogoWrapper = styled.p`
  margin-left: 1rem;
  @media only screen and (max-width: 500px) {
    margin-left: 0.5rem;
  }
`;

const LeftTitle = styled(Title)`
  margin-right: 9rem;
  @media only screen and (max-width: 500px) {
    margin-right: 1rem;
  }
`;

export const DetailsBox = styled.div`
  margin-left: 1rem;
`;

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
    let share0 = ethers.constants.Zero
    let share1 = ethers.constants.Zero
    if (supply.gt(ethers.constants.Zero)) {
      share0 = gross[0].mul(balancePool).div(supply);
      share1 = gross[1].mul(balancePool).div(supply);
    }
    const poolAddress = await guniPool.pool();
    const pool = new ethers.Contract(poolAddress, ["function slot0() external view returns (uint160 sqrtPriceX96,int24,uint16,uint16,uint16,uint8,bool)"], guniPool.provider)
    const {sqrtPriceX96} = await pool.slot0()
    let apy;
    try {
      apy = await fetchAPY(subgraphMap[guniPool.address], decimals0.toString(), decimals1.toString(), gross[0], gross[1], sqrtPriceX96, supply)
    } catch {
      apy = 0
    }
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
      share1: share1,
      apy: apy,
      sqrtPriceX96: sqrtPriceX96
    }
  }

  return null;
}

export const getLPTokenPrice = (snapshot: any, decimals0: string, decimals1: string): number => {
  const r0 = Number(ethers.utils.formatUnits(BigNumber.from(snapshot.r0), decimals0))
  const r1 = Number(ethers.utils.formatUnits(BigNumber.from(snapshot.r1), decimals1))
  const sqrtPriceX96 = BigNumber.from(snapshot.sqrtPriceX96)
  const priceX96X96 = sqrtPriceX96.mul(sqrtPriceX96)
  const priceX96 = priceX96X96.div(TWO.pow(BigNumber.from("96")))
  const priceX60 = priceX96.div(TWO.pow(BigNumber.from("36")))
  const price = (Number(priceX60.toString())*(10**Number(decimals0)))/((2**60)*(10**Number(decimals1)))
  const totalValue = r1 + (r0*price)
  const totalSupply = Number(ethers.utils.formatEther(BigNumber.from(snapshot.totalSupply)))
  return totalValue/totalSupply
}

export const fetchAPY = async (poolSubgraphName: string, decimals0: string, decimals1: string, r0: BigNumber, r1: BigNumber, sqrtPriceX96: BigNumber, supply: BigNumber): Promise<number> => {
  const APIURL = "https://api.thegraph.com/subgraphs/name/"+poolSubgraphName;

  const obsQ = `
    query {
      snapshots {
        r0
        r1
        totalSupply
        sqrtPriceX96
        timestamp
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
  const resp = data.data.snapshots
  const snapshots = [...resp].sort((a:any, b:any) => (a.timestamp > b.timestamp) ? 1 : -1)
  let cumulativeAPR = 0
  let cumulativeTime = 0
  const now = Math.round(new Date().getTime() / 1000);
  snapshots.push({
    r0: r0.toString(),
    r1: r1.toString(),
    totalSupply: supply.toString(),
    sqrtPriceX96: sqrtPriceX96.toString(),
    timestamp: now.toString()
  });
  for (let i=1; i<snapshots.length; i++) {
    const lastSnapshot = snapshots[i-1]
    const currentSnapshot = snapshots[i]
    if (Number(currentSnapshot.timestamp)+86400 > now) {
      const lastGUniTokenPrice = getLPTokenPrice(lastSnapshot, decimals0, decimals1)
      const currentGUniTokenPrice = getLPTokenPrice(currentSnapshot, decimals0, decimals1)
      const timeDelta = BigNumber.from(currentSnapshot.timestamp).sub(BigNumber.from(lastSnapshot.timestamp))
      const guniPriceDelta = currentGUniTokenPrice-lastGUniTokenPrice
      const guniPercentChange = guniPriceDelta/lastGUniTokenPrice
      cumulativeAPR += (guniPercentChange * 31536000)
      cumulativeTime += Number(timeDelta.toString())
    }
  }

  const avgAPR = cumulativeAPR / cumulativeTime
  console.log(avgAPR)
  const apy = ((1+(avgAPR/365))**365)-1
  console.log(apy)
  return apy
}

function PoolDetails(props: PoolParams) {
  const [poolDetails, setPoolDetails] = useState<PoolDetails|null>(null);
  const [seeMore, setSeeMore] = useState<boolean>(false);
  const [seeMoreText, setSeeMoreText] = useState<string>('Show');
  const {chainId, account} = useActiveWeb3React();
  const guniPool = props.pool;
  const token0 = useTokenContract(props.token0);
  const token1 = useTokenContract(props.token1);
  const currency0 = useCurrency(props.token0);
  const currency1 = useCurrency(props.token1);
  const handleSeeMore = () => {
    if (!seeMore) {
      setSeeMore(true);
      setSeeMoreText('Hide');
    } else {
      setSeeMore(false);
      setSeeMoreText('Show');
    }
  }
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
        <InnerBox>
          <TitleArea>
            <LogoWrapper><DoubleCurrencyLogo currency0={currency1 ? currency1 : undefined} currency1={currency0 ? currency0 : undefined} size={36} margin={true} /></LogoWrapper>
            <LeftTitle>{`${poolDetails.symbol0}/${poolDetails.symbol1} LP`}</LeftTitle>
            <ButtonSmall onClick={() => handleSeeMore()}>{seeMoreText}</ButtonSmall>
          </TitleArea>
          {seeMore ?
            <DetailsBox>
              <p>
                <strong>TVL:</strong>{` ${Number(formatBigNumber(poolDetails.supply0, poolDetails.decimals0, 2)).toLocaleString('en-US')} ${poolDetails.symbol0} + ${Number(formatBigNumber(poolDetails.supply1, poolDetails.decimals1, 2)).toLocaleString('en-US')} ${poolDetails.symbol1}`}
              </p>
              <p>
                <strong>TVL ($):</strong>{` $${Number((Number(ethers.utils.formatUnits(poolDetails.supply0, poolDetails.decimals0.toString())) + Number(ethers.utils.formatUnits(poolDetails.supply1, poolDetails.decimals1.toString()))).toFixed(2)).toLocaleString('en-US')}`}
              </p>
              <p>
                <strong>APY:</strong>{` ${poolDetails.apy > 0 ? `~${(poolDetails.apy*100).toFixed(2)}%` : 'TBD'}`}
              </p>
              <p>
                <strong>Your Share:</strong>{` ${Number(formatBigNumber(poolDetails.share0, poolDetails.decimals0, 2)).toLocaleString('en-US')} ${poolDetails.symbol0} + ${Number(formatBigNumber(poolDetails.share1, poolDetails.decimals1, 2)).toLocaleString('en-US')} ${poolDetails.symbol1}`}
              </p>
              <p>
                <strong>Your Share ($):</strong>{` $${Number((Number(ethers.utils.formatUnits(poolDetails.share0, poolDetails.decimals0.toString())) + Number(ethers.utils.formatUnits(poolDetails.share1, poolDetails.decimals1.toString()))).toFixed(2)).toLocaleString('en-US')}`}
              </p>
              <ButtonsArea>
                <ButtonMedium onClick={() => window.location.href = `/#/pools/add/${guniPool.address}`}>Add Liquidity</ButtonMedium>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <ButtonMedium onClick={() => window.location.href = `/#/pools/remove/${guniPool.address}`}>Remove Liquidity</ButtonMedium>
              </ButtonsArea>
              <br></br>
            </DetailsBox>
          :
            <></>
          }
        </InnerBox>
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
      {pool && poolTokens ? <><PoolDetails pool={pool} token0={poolTokens.token0} token1={poolTokens.token1} /><br></br></> : <></>}
    </>
  )
}