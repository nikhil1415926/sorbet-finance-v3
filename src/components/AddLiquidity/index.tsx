import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'
import { PoolDetails, PoolParams, PoolTokens, fetchPoolDetails, formatBigNumber } from '../../components/PoolInfo'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { ButtonPink } from 'components/Button'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
import {
  useTokenContract,
  useGUniPoolContract,
  useGUniResolverContract,
  useGUniRouterContract,
  useUniswapV3Quoter,
} from 'hooks/useContract'
import { tryParseAmount, useCurrency } from 'hooks/Tokens'
import { WETH9 } from '@uniswap/sdk-core'
import { useActiveWeb3React } from 'hooks/web3'
import { Contract } from '@ethersproject/contracts'
//import { useTranslation } from 'react-i18next'
import { ReactComponent as Plus } from 'assets/images/plus-blue.svg'
import './toggle.css'
import { ethers } from 'ethers'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import Modal from 'components/Modal'
import {Box, Title} from 'pages/Pools'

export const Area = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
`

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const Button = styled(ButtonPink)`
  width: 97%;
`

export const MarginLeft = styled.div`
  margin-left: 8%;
`

export const Column = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const Input = styled(CurrencyInputPanel)`
  width: 97%;
`;

export const Back = styled.a`
  margin-right: 5%;
  font-weight: 800;
`;

const WrappedPlus = ({ ...rest }) => <Plus {...rest} />
const ColoredWrappedPlus = styled(WrappedPlus)`
  width: 2rem;
  height: 2rem;
  position: relative;
  padding: 0.3rem;
  path {
    stroke: ${({ active }) => (active ? '#4169e1' : '#808080')};
  }
`

export const MAX_UINT = ethers.BigNumber.from(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
)

function AddLiquidityPanel(props: PoolParams) {
  const [poolDetails, setPoolDetails] = useState<PoolDetails | null>()
  const [input0, setInput0] = useState<string | null>()
  const [input1, setInput1] = useState<string | null>()
  const [inputError, setInputError] = useState<string | null>()
  const [is0Weth, setIs0Weth] = useState<boolean>(false)
  const [is1Weth, setIs1Weth] = useState<boolean>(false)
  const [noInputs, setNoInputs] = useState<boolean>(true)
  const [isApproved0, setIsApproved0] = useState<boolean>(true)
  const [isApproved1, setIsApproved1] = useState<boolean>(true)
  const [addEnabled, setAddEnabled] = useState<boolean>(false)
  const [isTransactionPending, setIsTransactionPending] = useState<boolean>(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [pendingTxHash, setPendingTxHash] = useState<string | null>()
  const [useEth, setUseEth] = useState<boolean>(true)
  /* eslint-disable  @typescript-eslint/no-unused-vars */
  const [swapAssets, setSwapAssets] = useState<boolean>(true)

  const [expected0, setExpected0] = useState<string | null>()
  const [expected1, setExpected1] = useState<string | null>()
  const [expectedMint, setExpectedMint] = useState<string | null>()
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false)
  const [depositProtocol, setDepositProtocol] = useState<string | null>()
  const [depositParams, setDepositParams] = useState<any | null>()
  const [waitMessage, setWaitMessage] = useState<string | null>()
  const { chainId, account } = useActiveWeb3React()
  const guniPool = props.pool
  const token0 = useTokenContract(props.token0)
  const token1 = useTokenContract(props.token1)

  const guniResolver = useGUniResolverContract()
  const quoter = useUniswapV3Quoter()
  const guniRouter = useGUniRouterContract()

  const eth = useCurrency('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
  const currency0 = useCurrency(props.token0)
  const currency1 = useCurrency(props.token1)

  const fiatValueEth = useUSDCValue(tryParseAmount(input0 ?? undefined, eth ?? undefined))
  const fiatValueCurrency0 = useUSDCValue(tryParseAmount(input0 ?? undefined, currency0 ?? undefined))
  const fiatValueCurrency1 = useUSDCValue(tryParseAmount(input1 ?? undefined, currency1 ?? undefined))

  const handleChangeInput0 = (e: any) => {
    setShowDetailsModal(false)
    setInput0(e)
  }
  const handleChangeInput1 = (e: any) => {
    setShowDetailsModal(false)
    setInput1(e)
  }
  /*const handleRebalanceCheckbox = () => {
    setShowDetailsModal(false);
    setSwapAssets(!swapAssets);
  }*/
  const handleEthCheckbox = () => {
    setShowDetailsModal(false)
    setUseEth(!useEth)
  }
  const handleCancel = () => {
    setShowDetailsModal(false)
  }
  const handleApprove0 = async () => {
    setWaitMessage(null)
    setIsTransactionPending(false)
    if (token0 && guniRouter && poolDetails) {
      setShowTransactionModal(true)
      setWaitMessage(`Approve ${poolDetails.symbol0}`)
      const tx = await token0.approve(guniRouter.address, MAX_UINT)
      setPendingTxHash(tx.hash)
      setIsTransactionPending(true)
      await tx.wait()
      setIsApproved0(true)
      setIsTransactionPending(false)
      if (isApproved1) {
        setAddEnabled(true);
      }
    }
  }
  const handleApprove1 = async () => {
    setWaitMessage(null)
    setIsTransactionPending(false)
    if (token1 && guniRouter && poolDetails) {
      setShowTransactionModal(true)
      setWaitMessage(`Approve ${poolDetails.symbol1}`)
      const tx = await token1.approve(guniRouter.address, MAX_UINT)
      setPendingTxHash(tx.hash)
      setIsTransactionPending(true)
      await tx.wait()
      setIsApproved1(true)
      setIsTransactionPending(false)
      if (isApproved0) {
        setAddEnabled(true);
      }
    }
  }
  const handleDeposit = async () => {
    setWaitMessage(null)
    setIsTransactionPending(false)
    if (guniRouter && poolDetails && depositParams) {
      let tx
      setShowTransactionModal(true)
      setWaitMessage(`Deposit ${useEth && is0Weth ? 'ETH' : poolDetails.symbol0} and/or ${useEth && is1Weth ? 'ETH' : poolDetails.symbol1} liquidity and mint G-UNI`)
      if (depositProtocol == 'addLiquidity') {
        tx = await guniRouter.addLiquidity(...depositParams)
      } else if (depositProtocol == 'addLiquidityETH') {
        tx = await guniRouter.addLiquidityETH(...depositParams, {
          value: is0Weth ? depositParams[1] : depositParams[2],
        })
      } else if (depositProtocol == 'rebalanceAndAddLiquidity') {
        tx = await guniRouter.rebalanceAndAddLiquidity(...depositParams)
      } else if (depositProtocol == 'rebalanceAndAddLiquidityETH') {
        tx = await guniRouter.rebalanceAndAddLiquidityETH(...depositParams, {
          value: is0Weth ? depositParams[1] : depositParams[2],
        })
      } else {
        setShowTransactionModal(false)
        return
      }
      setIsTransactionPending(true);
      setPendingTxHash(tx.hash)
      await reset()
      await tx.wait()
      setIsTransactionPending(false);
    }
  }
  const handleTryInputs = async () => {
    if (account && guniPool && guniResolver && quoter && token0 && token1 && guniRouter && poolDetails) {
      setInputError(null)
      setShowDetailsModal(false)
      try {
        const in0 = input0 ? ethers.utils.parseUnits(input0, poolDetails.decimals0.toString()) : ethers.constants.Zero
        const in1 = input1 ? ethers.utils.parseUnits(input1, poolDetails.decimals1.toString()) : ethers.constants.Zero
        if (!swapAssets && poolDetails.supply0.gt(0) && in0.eq(ethers.constants.Zero)) {
          setInputError(`Allow rebalance or provide non-zero value of ${poolDetails.symbol0}`)
          return
        }
        if (!swapAssets && poolDetails.supply1.gt(0) && in1.eq(ethers.constants.Zero)) {
          setInputError(`Allow rebalance or provide non-zero value of ${poolDetails.symbol1}`)
          return
        }
        if (!swapAssets) {
          const res = await guniPool.getMintAmounts(in0, in1)
          setExpected0(formatBigNumber(res[0], poolDetails.decimals0))
          setExpected1(formatBigNumber(res[1], poolDetails.decimals1))
          setExpectedMint(formatBigNumber(res[2], poolDetails.decimals))
          setDepositProtocol(useEth && (is0Weth || is1Weth) ? 'addLiquidityETH' : 'addLiquidity')
          setDepositParams([guniPool.address, in0, in1, 0, 0, account])
          setShowDetailsModal(true)
        } else {
          const res = await guniResolver.getRebalanceParams(guniPool.address, in0, in1, 200)
          const [zeroForOne, swapAmount, swapThreshold] = res
          if (swapAmount.gt(0)) {
            const pool = new ethers.Contract(
              await guniPool.pool(),
              ['function fee() external view returns (uint24)'],
              guniPool.provider
            )
            const fee = await pool.fee()
            const path = zeroForOne ? [props.token0, props.token1] : [props.token1, props.token0]
            const amountOut = await quoter.callStatic.quoteExactInputSingle(
              path[0],
              path[1],
              fee,
              swapAmount,
              swapThreshold
            )
            let new0
            let new1
            if (zeroForOne) {
              new0 = in0.sub(swapAmount)
              new1 = in1.add(amountOut)
            } else {
              new1 = in1.sub(swapAmount)
              new0 = in0.add(amountOut)
            }
            const res2 = await guniPool.getMintAmounts(new0, new1)
            setExpected0(formatBigNumber(res2[0], poolDetails.decimals0))
            setExpected1(formatBigNumber(res2[1], poolDetails.decimals1))
            setExpectedMint(formatBigNumber(res2[2], poolDetails.decimals))
            setDepositProtocol(
              useEth && (is0Weth || is1Weth) ? 'rebalanceAndAddLiquidityETH' : 'rebalanceAndAddLiquidity'
            )
            setDepositParams([guniPool.address, in0, in1, zeroForOne, swapAmount, swapThreshold, 0, 0, account])
            setShowDetailsModal(true)
          } else {
            const res2 = await guniPool.getMintAmounts(in0, in1)
            setExpected0(formatBigNumber(res2[0], poolDetails.decimals0))
            setExpected1(formatBigNumber(res2[1], poolDetails.decimals1))
            setExpectedMint(formatBigNumber(res2[2], poolDetails.decimals))
            setDepositProtocol(useEth && (is0Weth || is1Weth) ? 'addLiquidityETH' : 'addLiquidity')
            setDepositParams([guniPool.address, in0, in1, 0, 0, account])
            setShowDetailsModal(true)
          }
        }
      } catch (e) {
        setInputError('internal error (sorry!)')
        return
      }
    }
  }

  useEffect(() => {
    const getPool = async () => {
      if (guniPool && token0 && token1) {
        const details = await fetchPoolDetails(guniPool, token0, token1, account)
        setPoolDetails(details)
      }
      if (chainId) {
        if (WETH9[chainId].address == token0?.address) {
          setIs0Weth(true)
        } else if (WETH9[chainId].address == token1?.address) {
          setIs1Weth(true)
        }
      }
    }
    getPool()
  }, [guniPool, token0, token1, account, chainId])

  useEffect(() => {
    const checkApprovals = async () => {
      if (token0 && token1 && guniRouter && account && poolDetails) {
        let zeroApproved = false;
        let oneApproved = false;
        setInputError(null);
        if (!input0 && !input1) {
          setAddEnabled(false);
          setNoInputs(true);
          return
        }
        const in0 = input0 ? ethers.utils.parseUnits(input0, poolDetails.decimals0.toString()) : ethers.constants.Zero
        const in1 = input1 ? ethers.utils.parseUnits(input1, poolDetails.decimals1.toString()) : ethers.constants.Zero
        if (in0.gt(poolDetails.balance0) && (!useEth || !is0Weth)) {
          setInputError(`Insufficient balance of ${poolDetails.symbol0}`)
          setAddEnabled(false)
          return
        } else if (useEth && is0Weth && in0.gt(poolDetails.balanceEth)) {
          setInputError(`Insufficient balance of ETH`)
          setAddEnabled(false)
          return
        }
        if (in1.gt(poolDetails.balance1) && (!useEth || !is1Weth)) {
          setInputError(`Insufficient balance of ${poolDetails.symbol1}`)
          setAddEnabled(false)
          return
        } else if (useEth && is0Weth && in1.gt(poolDetails.balanceEth)) {
          setInputError(`Insufficient balance of ETH`)
          setAddEnabled(false)
          return
        }
        if (in0.eq(0) && in1.eq(0)) {
          setNoInputs(true);
          setAddEnabled(false)
          return
        } else {
          setNoInputs(false);
        }
        if (in0.eq(0)) {
          zeroApproved = true;
        }
        if (in1.eq(0)) {
          oneApproved = true;
        }
        if (
          (in0.lte((await token0.allowance(account, guniRouter.address)))) ||
          (useEth && is0Weth)
        ) {
          zeroApproved = true;
        }
        if (
          (in1.lte((await token1.allowance(account, guniRouter.address)))) ||
          (useEth && is1Weth)
        ) {
          oneApproved = true;
        }
        setIsApproved0(zeroApproved);
        setIsApproved1(oneApproved);
        if (zeroApproved && oneApproved) {
          setAddEnabled(true);
        }
      }
    }
    checkApprovals()
  }, [input0, input1, token0, token1, account, poolDetails, guniRouter, is0Weth, is1Weth, useEth])

  const reset = async () => {
    setInputError(null)
    setIsApproved0(false)
    setIsApproved1(false)
    setExpected0(null)
    setExpected1(null)
    setInput0(null)
    setInput1(null)
    setExpectedMint(null)
    setShowDetailsModal(false)
    if (guniPool && token0 && token1) {
      const details = await fetchPoolDetails(guniPool, token0, token1, account)
      setPoolDetails(details)
    }
  }
  return (
    <>
      {poolDetails ? (
        <Box>
          <Row>
          <Title>
            {`Add Liquidity to ${poolDetails.symbol0}/${poolDetails.symbol1} LP`}
          </Title>
          <Back href={'/#/pools'}>back</Back>
          </Row>
          <br></br>
          <Area>
            {is0Weth && useEth ? (
              <Input
                value={input0 ? input0 : ''}
                onUserInput={(e: string) => handleChangeInput0(e)}
                onMax={() => setInput0(formatBigNumber(poolDetails.balanceEth, 18, 18))}
                showCurrencySelector={true}
                showMaxButton={true}
                hideBalance={false}
                currency={eth}
                id={'input0Eth'}
                fiatValue={fiatValueEth}
              />
            ) : (
              <Input
                value={input0 ? input0 : ''}
                onUserInput={(e: string) => handleChangeInput0(e)}
                onMax={() =>
                  setInput0(formatBigNumber(poolDetails.balance0, poolDetails.decimals0, poolDetails.decimals0))
                }
                showCurrencySelector={true}
                showMaxButton={true}
                hideBalance={false}
                currency={currency0}
                fiatValue={fiatValueCurrency0}
                id={'input0'}
              />
            )}
          </Area>
          <Area>
            <ColoredWrappedPlus active={account} alt="plus" />
          </Area>
          <Area>
            {is1Weth && useEth ? (
              <Input
                value={input1 ? input1 : ''}
                onUserInput={(e: string) => handleChangeInput1(e)}
                onMax={() => setInput1(formatBigNumber(poolDetails.balanceEth, 18, 18))}
                showCurrencySelector={true}
                showMaxButton={true}
                hideBalance={false}
                currency={eth}
                fiatValue={fiatValueEth}
                id={'input1Eth'}
              />
            ) : (
              <Input
                value={input1 ? input1 : ''}
                onUserInput={(e: string) => handleChangeInput1(e)}
                onMax={() =>
                  setInput1(formatBigNumber(poolDetails.balance1, poolDetails.decimals1, poolDetails.decimals1))
                }
                showCurrencySelector={true}
                showMaxButton={true}
                hideBalance={false}
                currency={currency1}
                fiatValue={fiatValueCurrency1}
                id={'input1'}
              />
            )}
          </Area>
          <Area>
            {is0Weth || is1Weth ? (
              <>
                <br></br>
                Use WETH or ETH?
                <br></br>
                <label className="switch">
                  <input type="checkbox" onClick={() => handleEthCheckbox()} />
                  <div>
                    <br></br>
                    {useEth ? 'ETH' : 'WETH'}
                  </div>
                </label>
              </>
            ) : (
              <></>
            )}
          </Area>
          {inputError ? <Area><p style={{color: 'red'}}>{inputError}</p></Area>:<Area><p>&nbsp;</p></Area>}
          <Area>
            {((isApproved0 && isApproved1) || noInputs) ? <></> : 
              isApproved0 ?
                <>
                <Button onClick={() => handleApprove1()} disabled={isTransactionPending}>{isTransactionPending ? 'Pending Approval...': `Approve ${poolDetails.symbol1}`}</Button>
                <br></br>
                </>
              :
                <>
                <Button onClick={() => handleApprove0()} disabled={isTransactionPending}>{isTransactionPending ? 'Pending Approval...': `Approve ${poolDetails.symbol0}`}</Button>
                <br></br>
                </>
            }
            <Button disabled={!addEnabled || showDetailsModal} onClick={() => handleTryInputs()}>Add Liquidity</Button>
          </Area>
          <br></br>
          <br></br>
          <TransactionConfirmationModal
            content={() => <p></p>}
            isOpen={showTransactionModal}
            onDismiss={() => setShowTransactionModal(false)}
            hash={pendingTxHash ? pendingTxHash : undefined}
            attemptingTxn={!isTransactionPending}
            pendingText={waitMessage ? waitMessage : ''}
          />
          {showDetailsModal ? (
            <Modal isOpen={true} onDismiss={() => handleCancel()} maxHeight={90}>
              <Column>
              <MarginLeft>
                <h2>Add Liquidity</h2>
                {`Max Input: ${input0 ? Number(input0).toFixed(3) : '0'} ${
                  useEth && is0Weth ? 'ETH' : poolDetails.symbol0
                }, ${input1 ? Number(input1).toFixed(3) : '0'} ${useEth && is1Weth ? 'ETH' : poolDetails.symbol1}`}
                <br></br>
                Swap:{' '}
                {swapAssets && depositParams
                  ? depositParams[3]
                    ? `${formatBigNumber(depositParams[4], poolDetails.decimals0, 3)} ${
                        useEth && is0Weth ? 'ETH' : poolDetails.symbol0
                      } for ${(Number(expected1) - Number(input1 ? input1 : '0')).toFixed(3)} ${poolDetails.symbol1}`
                    : `${formatBigNumber(depositParams[4], poolDetails.decimals1, 3)} ${
                        useEth && is1Weth ? 'ETH' : poolDetails.symbol1
                      } for ${(Number(expected0) - Number(input0 ? input0 : '0')).toFixed(3)} ${poolDetails.symbol0}`
                  : 'no swap'}
                <br></br>
                {`Est. Deposit: ${expected0} ${poolDetails.symbol0}, ${expected1} ${poolDetails.symbol1}`}
                <br></br>
                {`Est. Mint: ${expectedMint} ${poolDetails.symbol} (${(
                  (100 * Number(expectedMint)) /
                  (Number(formatBigNumber(poolDetails.supply, poolDetails.decimals, 8)) + Number(expectedMint))
                ).toFixed(3)}% of supply)`}
              </MarginLeft>
              <br></br><br></br>
              <Area>
                <Button disabled={false} onClick={() => handleDeposit()}>Submit Transaction</Button>
              </Area>
              <br></br>
              <Area>
                <Button disabled={false} onClick={() => handleCancel()}>Cancel</Button>
              </Area>
              <br></br><br></br>
              </Column>
            </Modal>
          ) : (
            <></>
          )}
        </Box>
      ) : (
        <></>
      )}
    </>
  )
}

type PoolParam = {
  poolAddress: string
}

export default function AddLiquidity() {
  const params = useParams() as PoolParam
  const [poolTokens, setPoolTokens] = useState<PoolTokens | null>()
  const [pool, setPool] = useState<Contract>()
  const { chainId } = useActiveWeb3React()
  const guniPool = useGUniPoolContract(params.poolAddress)
  useEffect(() => {
    const getPoolInfo = async () => {
      if (guniPool) {
        const token0 = await guniPool.token0()
        const token1 = await guniPool.token1()
        setPoolTokens({ token0: token0, token1: token1 })
        setPool(guniPool)
      }
    }
    getPoolInfo()
  }, [guniPool, chainId])
  return (
    <>
      {pool && poolTokens ? (
        <AddLiquidityPanel pool={pool} token0={poolTokens.token0} token1={poolTokens.token1} />
      ) : (
        <></>
      )}
    </>
  )
}

/*
const [fiatValue0, setFiatValue0] = useState<CurrencyAmount<Token>>();
const [fiatValue1, setFiatValue1] = useState<CurrencyAmount<Token>>();
const usdPrice0 = useUSDCPrice(currency0 ? currency0 : undefined);
const usdPrice1 = useUSDCPrice(currency1 ? currency1 : undefined);
useEffect(() => {
  const getFiatValues = async () => {
    if (currency0 && usdPrice0 && input0 && poolDetails) {
      const amtString = ethers.utils.parseUnits(input0.toString(), poolDetails.decimals0.toString()).toString();
      const val = usdPrice0.quote(CurrencyAmount.fromRawAmount(currency0, amtString));
      console.log("fiat value 0:", val);
      setFiatValue0(val);
    }
    if (currency1 && usdPrice1 && input1 && poolDetails) {
      const amtString = ethers.utils.parseUnits(input1.toString(), poolDetails.decimals1.toString()).toString();
      const val = usdPrice1.quote(CurrencyAmount.fromRawAmount(currency1, amtString));
      console.log("fiat value 1:", val);
      setFiatValue1(val);
    }
  }
  getFiatValues();
}, [input0, currency0, usdPrice0, input1, currency1, usdPrice1, poolDetails]);

<Area>
  <Row>
  <strong>TVL:&nbsp;</strong>
  {` ${formatBigNumber(poolDetails.supply0, poolDetails.decimals0, 2)} ${
    poolDetails.symbol0
  } + ${formatBigNumber(poolDetails.supply1, poolDetails.decimals1, 2)} ${poolDetails.symbol1} `}
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <strong>Supply:&nbsp;</strong>
  {` ${formatBigNumber(poolDetails.supply, poolDetails.decimals, 4)} ${poolDetails.symbol}`}
  </Row>
</Area>
<br></br>
<Area>
  <Row>
  <strong>Your Position:&nbsp;</strong>
  {` ${formatBigNumber(poolDetails.balancePool, poolDetails.decimals, 4)} ${poolDetails.symbol}`}
  &nbsp;&nbsp;&nbsp;
  {`(${formatBigNumber(poolDetails.share0, poolDetails.decimals0, 2)} ${
    poolDetails.symbol0
  } + ${formatBigNumber(poolDetails.share1, poolDetails.decimals1, 2)} ${poolDetails.symbol1})`}
  </Row>
</Area>
*/
