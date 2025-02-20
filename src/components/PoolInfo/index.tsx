import React, {useEffect, useState} from 'react';
import {useTokenContract, useGUniPoolContract} from 'hooks/useContract';
import { useActiveWeb3React } from 'hooks/web3';
import {ethers} from 'ethers';
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import { useInView } from 'react-intersection-observer'
import styled from "styled-components";
import { tryParseAmount, useCurrency } from 'hooks/Tokens'
import useUSDCPrice from 'hooks/useUSDCPrice'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { ButtonPink } from 'components/Button'
import { PoolDetailComponent } from './pooldetails'
import Loader from 'components/Loader'

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
  apr: number
  sqrtPriceX96: BigNumber
  lowerTick: number
  upperTick: number
  manager: string
  feesEarned0: BigNumber
  feesEarned1: BigNumber
  lowerPrice: number
  upperPrice: number
}

export type FiatValues = {
  fiatShare0: string;
  fiatShare1: string;
  fiatTotal0: string;
  fiatTotal1: string;
}

type PoolDetailsShort = {
  symbol: string
  symbol0: string
  symbol1: string
}

type APRType = {
  apr: number
  feesEarned0: BigNumber
  feesEarned1: BigNumber
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
  width: 5vw;
  margin-right: 1rem;
  padding-top: 0.03rem;
  padding-bottom: 0.03rem;
  @media only screen and (max-width: 500px) {
    width: 20%;
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

const Title = styled.p`
  margin-left: 1rem;
  font-weight: 800;
  font-size: 1.2rem;
  @media only screen and (max-width: 500px) {
    font-size: 1.1rem;
  }
`;

export const LogoWrapper = styled.div`
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

const ShowMoreLoader = styled(Loader)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`

const Load = styled.p`
  text-align: center;
  margin-right: 5rem;
  margin-left: 5rem;
`

const X96 = BigNumber.from(2).pow(BigNumber.from(96))
const BLOCKS_PER_YEAR = 2102400

const computeAverageReserves = (snapshots: any, firstBlock: number, lastBlock: number) => {
  let cumulativeBlocks = BigNumber.from(0)
  let cumulativeReserves = BigNumber.from(0)
  for (let i=1; i<snapshots.length+1; i++) {
    if (Number(snapshots[i-1].block) < lastBlock) {
      if (i == snapshots.length || Number(snapshots[i].block) > firstBlock) {
        const reserves0 = BigNumber.from(snapshots[i-1].reserves0)
        const reserves1 = BigNumber.from(snapshots[i-1].reserves1)
        const priceX96X96 = BigNumber.from(snapshots[i-1].sqrtPriceX96).mul(BigNumber.from(snapshots[i-1].sqrtPriceX96))
        const reserves0As1X96 = reserves0.mul(priceX96X96).div(X96)
        const reserves0As1 = reserves0As1X96.div(X96)
        const reserves = reserves1.add(reserves0As1)
        let blockDifferential: BigNumber
        if (i<snapshots.length) {
          blockDifferential = BigNumber.from(snapshots[i].block).sub(BigNumber.from(snapshots[i-1].block))
        } else {
          blockDifferential = BigNumber.from(lastBlock).sub(BigNumber.from(snapshots[i-1].block))
        }
        cumulativeReserves = cumulativeReserves.add(reserves.mul(blockDifferential))
        cumulativeBlocks = cumulativeBlocks.add(blockDifferential)
      }
    }
  }
  if (cumulativeBlocks.gt(ethers.constants.Zero)) {
    return cumulativeReserves.div(cumulativeBlocks)
  } else {
    return ethers.constants.Zero
  }
}

const computeTotalFeesEarned = (snapshots: any, sqrtPriceX96: BigNumber, firstBlock: number): BigNumber[] => {
  let feesEarned0 = BigNumber.from(0)
  let feesEarned1 = BigNumber.from(0)
  let totalFeesEarned0 = BigNumber.from(0)
  let totalFeesEarned1 = BigNumber.from(0)
  for (let i=0; i<snapshots.length; i++) {
    if (Number(snapshots[i].block) >= firstBlock) {
      feesEarned0 = feesEarned0.add(BigNumber.from(snapshots[i].feesEarned0))
      feesEarned1 = feesEarned1.add(BigNumber.from(snapshots[i].feesEarned1))
    }
    totalFeesEarned0 = totalFeesEarned0.add(BigNumber.from(snapshots[i].feesEarned0))
    totalFeesEarned1 = totalFeesEarned1.add(BigNumber.from(snapshots[i].feesEarned1))
  }
  const priceX96X96 = sqrtPriceX96.mul(sqrtPriceX96)
  const fees0As1X96 = feesEarned0.mul(priceX96X96).div(X96)
  const fees0As1 = fees0As1X96.div(X96)
  return [feesEarned1.add(fees0As1), totalFeesEarned0, totalFeesEarned1]
}

const getAPR = (poolData: any, sqrtPriceX96: BigNumber, currentFees0: BigNumber, currentFees1: BigNumber, lastBlock: string): APRType => {
  if (poolData.supplySnapshots.length == 0 || poolData.feeSnapshots.length == 0) {
    return {
      apr: 0,
      feesEarned0: ethers.constants.Zero,
      feesEarned1: ethers.constants.Zero,
    }
  }
  const snapshots = [...poolData.feeSnapshots].sort((a: any, b:any) => (a.block > b.block) ? 1: -1)
  const supplySnaps = [...poolData.supplySnapshots].sort((a: any, b: any) => (a.block > b.block) ? 1: -1)
  let firstBlock = (Number(lastBlock) - 40320*4).toString()
  if (Number(firstBlock) < Number(poolData.lastTouchWithoutFees)) {
    firstBlock = poolData.lastTouchWithoutFees
  }
  snapshots.push({
    feesEarned0: currentFees0.toString(),
    feesEarned1: currentFees1.toString(),
    block: lastBlock
  });
  if (snapshots.length == 0 || supplySnaps.length == 0) {
    return {
      apr: 0,
      feesEarned0: ethers.constants.Zero,
      feesEarned1: ethers.constants.Zero,
    }
  }
  const [totalFeeValue, feesTotal0, feesTotal1] = computeTotalFeesEarned(snapshots, sqrtPriceX96, Number(firstBlock))
  const averageReserves = computeAverageReserves(supplySnaps, Number(firstBlock), Number(lastBlock))
  let apr = 0
  if (averageReserves.gt(ethers.constants.Zero)) {
    let averagePrincipal = averageReserves.sub(totalFeeValue)
    if (averagePrincipal.lte(ethers.constants.Zero)) {
      averagePrincipal = averageReserves
    }
    const totalBlocks = Number(lastBlock) - Number(firstBlock)
    apr = (Number(ethers.utils.formatEther(totalFeeValue)) * BLOCKS_PER_YEAR) / (Number(ethers.utils.formatEther(averagePrincipal)) * totalBlocks)
  }
  return {
    apr: apr,
    feesEarned0: feesTotal0,
    feesEarned1: feesTotal1
  }
}

export const fetchPoolDetails = async (poolData: any, guniPool: Contract, token0: Contract, token1 : Contract, account : string|undefined|null) :Promise<PoolDetails|null> => {
  if (guniPool && token0 && token1 && poolData) {
    console.log(`fetching pool details (${guniPool.address})...`)
    try {
      let balancePool = ethers.constants.Zero;
      let balance0 = ethers.constants.Zero;
      let balance1 = ethers.constants.Zero;
      let balanceEth = ethers.constants.Zero;
      if (account) {
        balancePool = await guniPool.balanceOf(account);
        balance0 = await token0.balanceOf(account);
        balance1 = await token1.balanceOf(account);
        balanceEth = await guniPool.provider.getBalance(account);
      }
      const name = await guniPool.name();
      const gross = await guniPool.getUnderlyingBalances();
      const supply = BigNumber.from(poolData.totalSupply);
      const lowerTick = Number(poolData.lowerTick);
      const upperTick = Number(poolData.upperTick);
      const decimals0 = await token0.decimals();
      const decimals1 = await token1.decimals();
      const symbol0 = await token0.symbol();
      const symbol1 = await token1.symbol();
      let share0 = ethers.constants.Zero
      let share1 = ethers.constants.Zero
      if (supply.gt(ethers.constants.Zero)) {
        share0 = gross[0].mul(balancePool).div(supply);
        share1 = gross[1].mul(balancePool).div(supply);
      }
      const pool = new ethers.Contract(
        ethers.utils.getAddress(poolData.uniswapPool),
        ["function slot0() external view returns (uint160 sqrtPriceX96,int24,uint16,uint16,uint16,uint8,bool)", "function positions(bytes32) external view returns(uint128 _liquidity,uint256,uint256,uint128,uint128)"],
        guniPool.provider
      );
      const {sqrtPriceX96} = await pool.slot0()
      const helperContract = new ethers.Contract(
        "0xFbd0B8D8016b9f908fC9652895c26C5a4994fE36",
        ["function getAmountsForLiquidity(uint160,int24,int24,uint128) external pure returns(uint256 amount0, uint256 amount1)"],
        guniPool.provider
      );
      const {_liquidity} = await pool.positions(poolData.positionId)
      const {amount0: amount0Liquidity, amount1: amount1Liquidity} = await helperContract.getAmountsForLiquidity(sqrtPriceX96, poolData.lowerTick, poolData.upperTick, _liquidity)
      const leftover0 = await token0.balanceOf(guniPool.address)
      const leftover1 = await token1.balanceOf(guniPool.address)
      const extraFees0 = gross[0].sub(amount0Liquidity).sub(leftover0)
      const extraFees1 = gross[1].sub(amount1Liquidity).sub(leftover1)
      const block = await pool.provider.getBlock('latest')
      const {apr, feesEarned0, feesEarned1} = getAPR(
        poolData,
        sqrtPriceX96,
        extraFees0,
        extraFees1,
        block.number.toString()
      );
      const factor = (10**decimals0)/(10**decimals1)
      const lowerPrice = (1.0001**lowerTick)*factor
      const upperPrice = (1.0001**upperTick)*factor
      console.log(`pool details COMPLETE (${guniPool.address})`)
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
        apr: apr,
        sqrtPriceX96: sqrtPriceX96,
        lowerTick: lowerTick,
        upperTick: upperTick,
        manager: poolData.manager,
        feesEarned0: feesEarned0,
        feesEarned1: feesEarned1,
        lowerPrice: lowerPrice,
        upperPrice: upperPrice
      }
    } catch (_e) {
      console.log(`error fetching pool details ${poolData.address}`)
    }
  }

  return null;
}

export const fetchPoolDetailsShort = async (guniPool: Contract, token0: Contract, token1 : Contract) :Promise<PoolDetailsShort|null> => {
  if (guniPool && token0 && token1) {
    const symbol0 = await token0.symbol();
    const symbol1 = await token1.symbol();
    return {
      symbol: "G-UNI",
      symbol0: symbol0,
      symbol1: symbol1,
    }
  }
  return null;
}

const getFiatValues = (details: any, currency0: any, currency1: any, fiatPrice0: any, fiatPrice1: any): FiatValues  => {
  const currencyAmountTotal0 = tryParseAmount(ethers.utils.formatUnits(details.supply0, details.decimals0.toString()), currency0)
  const currencyAmountShare0 = tryParseAmount(ethers.utils.formatUnits(details.share0, details.decimals0.toString()), currency0)
  let fiatShare0 = '0'
  let fiatShare1 = '0'
  let fiatTotal0 = '0'
  let fiatTotal1 = '0'
  try {
    if (currencyAmountShare0) {
      if (details.symbol0 === "USDC") {
        fiatShare0 = Number(ethers.utils.formatUnits(details.share0, details.decimals0.toString())).toFixed(4)
      } else {
        const share0 = fiatPrice0.quote(currencyAmountShare0)
        fiatShare0 = share0 ? share0.toFixed(4) : '0'
      }
    }
  } catch(_e) {
    console.log("Share not exist 0")
    fiatShare0 = '0'
  }
  if (currencyAmountTotal0) {
    if (details.symbol0 === "USDC") {
      fiatTotal0 =Number(ethers.utils.formatUnits(details.supply0, details.decimals0.toString())).toFixed(4)
    } else {
      const total0 = fiatPrice0.quote(currencyAmountTotal0)
      fiatTotal0 = total0 ? total0.toFixed(4) : '0'
    }
  } else {
    fiatTotal0 = '0'
  }
  const currencyAmountTotal1 = tryParseAmount(ethers.utils.formatUnits(details.supply1, details.decimals1.toString()), currency1)
  const currencyAmountShare1 = tryParseAmount(ethers.utils.formatUnits(details.share1, details.decimals1.toString()), currency1)
  try {
    if (currencyAmountShare1) {
      if (details.symbol1 === "USDC") {
        fiatShare1 = Number(ethers.utils.formatUnits(details.share1, details.decimals1.toString())).toFixed(4)
      } else {
        const share1 = fiatPrice1.quote(currencyAmountShare1)
        fiatShare1 = share1 ? share1.toFixed(4) : '0'
      }
    }
  } catch(_e) {
    console.log("Share not exist 1")
    fiatShare1 = '0'
  }
  if (currencyAmountTotal1) {
    if (details.symbol1 === "USDC") {
      fiatTotal1 = Number(ethers.utils.formatUnits(details.supply1, details.decimals1.toString())).toFixed(4)
    } else {
      const total1 = fiatPrice1.quote(currencyAmountTotal1)
      fiatTotal1 = total1 ? total1.toFixed(4) : '0'
    }
  } else {
    fiatTotal1 = '0'
  }
  return {
    fiatShare0: fiatShare0,
    fiatShare1: fiatShare1,
    fiatTotal0: fiatTotal0,
    fiatTotal1: fiatTotal1
  }
}

export default function PoolInfo(props: any) {
  const poolData = props.poolData;
  const guniPool = useGUniPoolContract(ethers.utils.getAddress(poolData.id));
  const [poolDetails, setPoolDetails] = useState<PoolDetailsShort|null>(null);
  const [poolDetailsLong, setPoolDetailsLong] = useState<PoolDetails|null>(null);
  const [seeMore, setSeeMore] = useState<boolean>(false);
  const [fetchingPool, setFetchingPool] = useState<boolean>(false);
  const [seeMoreText, setSeeMoreText] = useState<string>('Show');
  const [fiatValues, setFiatValues] = useState<FiatValues|null>(null);
  const {account} = useActiveWeb3React();
  const token0 = useTokenContract(ethers.utils.getAddress(poolData.token0.address));
  const token1 = useTokenContract(ethers.utils.getAddress(poolData.token1.address));
  const currency0 = useCurrency(ethers.utils.getAddress(poolData.token0.address));
  const currency1 = useCurrency(ethers.utils.getAddress(poolData.token1.address));
  const fiatPrice0 = useUSDCPrice(currency0 ?? undefined);
  const fiatPrice1 = useUSDCPrice(currency1 ?? undefined);
  const [ref, inView] = useInView({
    threshold: 0,
  })
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
        fetchPoolDetailsShort(guniPool, token0, token1).then((result) => {
          setPoolDetails(result);
        })
      }
    }
    getPoolDetails();
  }, [guniPool, token0, token1]);
  useEffect(() => {
    if (inView && !fetchingPool && guniPool && token0 && token1 && currency0 && currency1 && fiatPrice0 && fiatPrice1 && poolDetails != null && poolDetailsLong == null) {
      setFetchingPool(true);
      fetchPoolDetails(poolData, guniPool, token0, token1, account).then((details) => {
        setPoolDetailsLong(details);
        if (details) {
          const fiatValues = getFiatValues(details, currency0, currency1, fiatPrice0, fiatPrice1)
          setFiatValues(fiatValues)
          setFetchingPool(false);
        }
      })
    }
  }, [inView, guniPool, token0, token1, account, poolData, fiatPrice0, fiatPrice1, currency0, currency1, poolDetails, poolDetailsLong, fetchingPool])

  return (
    <>
      {poolDetails ? 
        <InnerBox ref={ref}>
          <TitleArea>
            <LogoWrapper>
              <DoubleCurrencyLogo currency0={currency1 ? currency1 : undefined} currency1={currency0 ? currency0 : undefined} size={36} margin={true} />
            </LogoWrapper>
            <LeftTitle>{`${poolDetails.symbol0}/${poolDetails.symbol1} LP`}</LeftTitle>
            <ButtonSmall onClick={() => handleSeeMore()} disabled={poolDetailsLong ? false : true}>{poolDetailsLong ? seeMoreText : <ShowMoreLoader stroke="white"/>}</ButtonSmall>
          </TitleArea>
          { seeMore ? <PoolDetailComponent guniPool={guniPool} poolDetails={poolDetailsLong} fiatValues={fiatValues} /> : <></> }
        </InnerBox>
      :
        <InnerBox>
          <TitleArea><Load>loading...</Load></TitleArea>
        </InnerBox>
      }
      <br></br>
    </>
  )
}