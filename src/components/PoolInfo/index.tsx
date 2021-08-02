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

const X96 = BigNumber.from(2).pow(BigNumber.from(96))
const BLOCKS_PER_YEAR = 2102400

const computeAverageReserves = (snapshots: any, sqrtPriceX96: BigNumber, firstBlock: number, lastBlock: number) => {
  let cumulativeBlocks = BigNumber.from(0)
  let cumulativeReserves = BigNumber.from(0)
  const priceX96X96 = sqrtPriceX96.mul(sqrtPriceX96)
  for (let i=0; i<snapshots.length; i++) {
    if (Number(snapshots[i].block) > firstBlock && Number(snapshots[i].block) < lastBlock) {
      const reserves0 = BigNumber.from(snapshots[i].reserves0)
      const reserves1 = BigNumber.from(snapshots[i].reserves1)
      const reserves0As1X96 = reserves0.mul(priceX96X96).div(X96)
      const reserves0As1 = reserves0As1X96.div(X96)
      const reserves = reserves1.add(reserves0As1)
      let blockDifferential: BigNumber
      if (i==0) {
        blockDifferential = BigNumber.from(snapshots[i].block).sub(BigNumber.from(firstBlock.toString()))
      } else {
        blockDifferential = BigNumber.from(snapshots[i].block).sub(BigNumber.from(snapshots[i-1].block))
      }
      if (blockDifferential.lt(ethers.constants.Zero)) {
        blockDifferential = ethers.constants.Zero
      }
      cumulativeReserves = cumulativeReserves.add(reserves.mul(blockDifferential))
      cumulativeBlocks = cumulativeBlocks.add(blockDifferential)
    }
  }
  return cumulativeReserves.div(cumulativeBlocks)
}

const computeTotalFeesEarned = (snapshots: any, sqrtPriceX96: BigNumber): BigNumber[] => {
  let feesEarned0 = BigNumber.from(0)
  let feesEarned1 = BigNumber.from(0)
  for (let i=0; i<snapshots.length; i++) {
    feesEarned0 = feesEarned0.add(BigNumber.from(snapshots[i].feesEarned0))
    feesEarned1 = feesEarned1.add(BigNumber.from(snapshots[i].feesEarned1))
  }
  const priceX96X96 = sqrtPriceX96.mul(sqrtPriceX96)
  const fees0As1X96 = feesEarned0.mul(priceX96X96).div(X96)
  const fees0As1 = fees0As1X96.div(X96)
  return [feesEarned1.add(fees0As1), feesEarned0, feesEarned1]
}

const getAPR = (poolData: any, sqrtPriceX96: BigNumber): APRType => {
  if (poolData.supplySnapshots.length == 0 || poolData.feeSnapshots.length == 0) {
    return {
      apr: 0,
      feesEarned0: ethers.constants.Zero,
      feesEarned1: ethers.constants.Zero,
    }
  }
  const snapshots = [...poolData.feeSnapshots].sort((a: any, b:any) => (a.block > b.block) ? 1: -1)
  const supplySnaps = [...poolData.supplySnapshots].sort((a: any, b: any) => (a.block > b.block) ? 1: -1)
  const lastBlock = snapshots[snapshots.length-1].block
  const [totalFeeValue, feesTotal0, feesTotal1] = computeTotalFeesEarned(snapshots, sqrtPriceX96)
  const averageReserves = computeAverageReserves(supplySnaps, sqrtPriceX96, Number(poolData.lastTouchWithoutFees), lastBlock)
  let averagePrincipal = averageReserves.sub(totalFeeValue)
  if (averagePrincipal.lt(ethers.constants.Zero)) {
    averagePrincipal = averageReserves
  }
  const totalBlocks = Number(lastBlock) - Number(poolData.lastTouchWithoutFees)
  const apr = (Number(ethers.utils.formatEther(totalFeeValue)) * BLOCKS_PER_YEAR) / (Number(ethers.utils.formatEther(averagePrincipal)) * totalBlocks)
  return {
    apr: apr,
    feesEarned0: feesTotal0,
    feesEarned1: feesTotal1
  }
} 

export const fetchPoolDetails = async (poolData: any, guniPool: Contract, token0: Contract, token1 : Contract, account : string|undefined|null) :Promise<PoolDetails|null> => {
  if (guniPool && token0 && token1) {
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
    const {apr, feesEarned0, feesEarned1} = getAPR(
      poolData,
      sqrtPriceX96
    );
    const factor = (10**decimals0)/(10**decimals1)
    const lowerPrice = (1.0001**lowerTick)*factor
    const upperPrice = (1.0001**upperTick)*factor
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
      feesEarned0: feesEarned0.add(extraFees0),
      feesEarned1: feesEarned1.add(extraFees1),
      lowerPrice: lowerPrice,
      upperPrice: upperPrice
    }
  }

  return null;
}

export default function PoolInfo(props: any) {
  const poolData = props.poolData;
  const guniPool = useGUniPoolContract(ethers.utils.getAddress(poolData.id));
  const [poolDetails, setPoolDetails] = useState<PoolDetails|null>(null);
  const [seeMore, setSeeMore] = useState<boolean>(false);
  const [seeMoreText, setSeeMoreText] = useState<string>('Show');
  const {chainId, account} = useActiveWeb3React();
  const token0 = useTokenContract(ethers.utils.getAddress(poolData.token0));
  const token1 = useTokenContract(ethers.utils.getAddress(poolData.token1));
  const currency0 = useCurrency(ethers.utils.getAddress(poolData.token0));
  const currency1 = useCurrency(ethers.utils.getAddress(poolData.token1));
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
        const details = await fetchPoolDetails(poolData, guniPool, token0, token1, account);
        setPoolDetails(details);
      }
    }
    getPoolDetails();
  }, [guniPool, token0, token1, account, chainId, poolData]);
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
                <strong>Total Fees Earned:</strong>{` ${Number(formatBigNumber(poolDetails.feesEarned0, poolDetails.decimals0, 4)).toLocaleString('en-US')} ${poolDetails.symbol0} + ${Number(formatBigNumber(poolDetails.feesEarned1, poolDetails.decimals1, 4)).toLocaleString('en-US')} ${poolDetails.symbol1}`}
              </p>
              <p>
                <strong>Fees APR:</strong>{` ${poolDetails.apr > 0 ? `~${(poolDetails.apr*100).toFixed(2)}%` : 'TBD'}`}
              </p>
              <p>
                <strong>Position Range:</strong>{` ${poolDetails.lowerPrice.toFixed(4)} ${poolDetails.symbol1} - ${poolDetails.upperPrice.toFixed(4)} ${poolDetails.symbol1}`}
              </p>
              <p>
                <strong>Your Share:</strong>{` ${Number(formatBigNumber(poolDetails.share0, poolDetails.decimals0, 2)).toLocaleString('en-US')} ${poolDetails.symbol0} + ${Number(formatBigNumber(poolDetails.share1, poolDetails.decimals1, 2)).toLocaleString('en-US')} ${poolDetails.symbol1}`}
              </p>
              <p>
                <strong>Your Share ($):</strong>{` $${Number((Number(ethers.utils.formatUnits(poolDetails.share0, poolDetails.decimals0.toString())) + Number(ethers.utils.formatUnits(poolDetails.share1, poolDetails.decimals1.toString()))).toFixed(2)).toLocaleString('en-US')}`}
              </p>
              <ButtonsArea>
                <ButtonMedium onClick={() => window.location.href = `/#/pools/add/${guniPool?.address}`}>Add Liquidity</ButtonMedium>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <ButtonMedium onClick={() => window.location.href = `/#/pools/remove/${guniPool?.address}`}>Remove Liquidity</ButtonMedium>
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
      <br></br>
    </>
  )
}

/*export default function PoolInfo(props: AddressParam) {
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
}*/