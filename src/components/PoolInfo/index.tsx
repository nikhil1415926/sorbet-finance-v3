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
`;

const ButtonMedium = styled(ButtonPink)`
  width: 40%;
`;

const InnerBox = styled.div`
  background-color: #2C2F36;
  border-radius: 0.5rem;
  border: 1px solid #7d7f7c;
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
`;

const LogoWrapper = styled.p`
  margin-left: 1rem;
`;

const LeftTitle = styled(Title)`
  margin-left: -9.5rem;
`;

const DetailsBox = styled.div`
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
            <LogoWrapper><DoubleCurrencyLogo currency0={currency0 ? currency0 : undefined} currency1={currency1 ? currency1 : undefined} size={36} margin={true} /></LogoWrapper>
            <LeftTitle>{`${poolDetails.symbol0}/${poolDetails.symbol1} LP`}</LeftTitle>
            <ButtonSmall onClick={() => handleSeeMore()}>{seeMoreText}</ButtonSmall>
          </TitleArea>
          {seeMore ?
            <DetailsBox>
              <p>
                <strong>TVL:</strong>
                {` ${formatBigNumber(poolDetails.supply0, poolDetails.decimals0, 2)} ${poolDetails.symbol0} + ${formatBigNumber(poolDetails.supply1, poolDetails.decimals1, 2)} ${poolDetails.symbol1} `}
              </p>
              <p>
                <strong>Supply:</strong>
                {` ${formatBigNumber(poolDetails.supply, poolDetails.decimals, 4)} ${poolDetails.symbol}`}
              </p>
              <p><strong>Your Share:</strong>{` ${formatBigNumber(poolDetails.balancePool, poolDetails.decimals, 4)} ${poolDetails.symbol}`}</p>
              <p><strong>Your Share Value:</strong>{` ${formatBigNumber(poolDetails.share0, poolDetails.decimals0, 2)} ${poolDetails.symbol0} + ${formatBigNumber(poolDetails.share1, poolDetails.decimals1, 2)} ${poolDetails.symbol1}`}</p>
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
      {pool && poolTokens ? <PoolDetails pool={pool} token0={poolTokens.token0} token1={poolTokens.token1} /> : <></>}
    </>
  )
}