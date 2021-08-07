import React from 'react'
import styled from "styled-components"
import {ethers, Contract} from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'
import { ButtonPink } from 'components/Button'
import Loader from 'components/Loader'
import { PoolDetails, FiatValues } from '.'

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
  poolDetails: PoolDetails | null;
  guniPool: Contract |  null;
  fiatValues: FiatValues | null;
}
export const PoolDetailComponent: React.FC<PoolDetailProps> = ({ poolDetails, guniPool, fiatValues }: PoolDetailProps) => {
  return (
    <>
      {poolDetails ?
          <DetailsBox>
            <p>
              <strong>TVL:</strong>{` ${Number(formatBigNumber(poolDetails.supply0, poolDetails.decimals0, 2)).toLocaleString('en-US')} ${poolDetails.symbol0} + ${Number(formatBigNumber(poolDetails.supply1, poolDetails.decimals1, 2)).toLocaleString('en-US')} ${poolDetails.symbol1}`}
            </p>
            <p>
              <strong>TVL ($):</strong>{fiatValues ? ` $${(Number(fiatValues.fiatTotal0) + Number(fiatValues.fiatTotal1)).toLocaleString('en-US')}` : ' $0'}
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
              <strong>Your Share ($):</strong>{fiatValues ? ` $${(Number(fiatValues.fiatShare0) + Number(fiatValues.fiatShare1)).toLocaleString('en-US')}` : ' $0'}
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