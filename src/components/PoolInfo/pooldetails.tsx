import React, { useState, useEffect } from 'react'
import styled from "styled-components"
import {useTokenContract, useGUniPoolContract} from 'hooks/useContract'
import { useCurrency } from 'hooks/Tokens'
import {ethers} from 'ethers'
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import { ButtonPink } from 'components/Button'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks/web3';
import { fetchPoolDetails } from '.'

const DetailsBox = styled.div`
  margin-left: 1rem;
`;

const ButtonsArea = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ButtonMedium = styled(ButtonPink)`
  width: 40%;
  @media only screen and (max-width: 500px) {
    width: 33%;
  }
`;

const DetailsLoader = styled(Loader)`
  width: 40vw;
  height: 2vh;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`

type APRType = {
  apr: number
  feesEarned0: BigNumber
  feesEarned1: BigNumber
}
type PoolDetails = {
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

const formatBigNumber = (n: BigNumber, decimals: number, roundTo = 3): string => {
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


interface PoolDetailProps {
  poolData: any;
}
export const PoolDetailComponent: React.FC<PoolDetailProps> = ({ poolData }: PoolDetailProps) => {
  const guniPool = useGUniPoolContract(ethers.utils.getAddress(poolData.id));
  const token0 = useTokenContract(ethers.utils.getAddress(poolData.token0));
  const token1 = useTokenContract(ethers.utils.getAddress(poolData.token1));
  const {account} = useActiveWeb3React();
  const [poolDetails, setPoolDetails] = useState<PoolDetails|null>(null);
  useEffect(() => {
    const getPoolDetails = async () => {
      if (guniPool && token0 && token1) {
        const start = Date.now();
        const details = await fetchPoolDetails(poolData, guniPool, token0, token1, account);
        const end = Date.now();
        const duration = end - start;
        console.log(`seconds elapsed = ${Math.floor(duration / 1000)}s`);
        setPoolDetails(details);
      }
    }
    getPoolDetails();
  }, []);
  return (
    <>
      {poolDetails ?
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
          <DetailsLoader />
      }
    </>
  )
}