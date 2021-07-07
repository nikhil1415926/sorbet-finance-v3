import React, {useEffect, useState} from 'react';
//import styled from "styled-components";
import {useParams} from "react-router-dom";
import {PoolDetails, PoolParams, PoolTokens, fetchPoolDetails, formatBigNumber} from '../../components/PoolInfo';
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import {
  useTokenContract,
  useGUniPoolContract,
  useGUniRouterContract
} from 'hooks/useContract';
import { Currency, Token, WETH9 } from '@uniswap/sdk-core';
import { useActiveWeb3React } from 'hooks/web3';
import { Contract } from '@ethersproject/contracts'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
//import useUSDCPrice from 'hooks/useUSDCPrice'
//import { useTranslation } from 'react-i18next'
import { Area, Button, ButtonLong, MarginLeft, Popover, CenteredFlex, MAX_UINT } from '../AddLiquidity'
import '../AddLiquidity/toggle.css';
import { ethers } from 'ethers';

function RemoveLiquidityPanel(props: PoolParams) {
  const [poolDetails, setPoolDetails] = useState<PoolDetails|null>();
  const [inputBurn, setInputBurn] = useState<string|null>();
  const [inputError, setInputError] = useState<string|null>();
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [is0Weth, setIs0Weth] = useState<boolean>(false);
  const [is1Weth, setIs1Weth] = useState<boolean>(false);
  const [useEth, setUseEth] = useState<boolean>(true);
  const [isTransactionPending, setIsTransactionPending] = useState<boolean>(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string|null>();
  const [expected0, setExpected0] = useState<string|null>();
  const [expected1, setExpected1] = useState<string|null>();
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [burnParams, setBurnParams] = useState<any|null>();
  const [waitMessage, setWaitMessage] = useState<string|null>();
  const [currency, setCurrency] = useState<Currency>();
  const {chainId, account} = useActiveWeb3React();
  const guniPool = props.pool;
  const token0 = useTokenContract(props.token0);
  const token1 = useTokenContract(props.token1);
  const guniRouter = useGUniRouterContract();
  const handleChangeInput = (e: any) => {
    setShowDetailsModal(false);
    setInputBurn(e);
  }
  const handleEthCheckbox = () => {
    setShowDetailsModal(false);
    setUseEth(!useEth);
  }
  const handleCancel = () => {
    setShowDetailsModal(false);
  }
  const handleApprove = async () => {
    setWaitMessage(null);
    setIsTransactionPending(false);
    if (guniPool && guniRouter && poolDetails) {
      setShowTransactionModal(true);
      setWaitMessage(`Approve G-UNI`);
      const tx = await guniPool.approve(guniRouter.address, MAX_UINT);
      setPendingTxHash(tx.hash);
      setIsTransactionPending(true);
      await tx.wait();
      setIsApproved(true);
      setIsTransactionPending(false);
    }
  }
  const handleBurn = async () => {
    setWaitMessage(null);
    setIsTransactionPending(false);
    if (guniRouter && poolDetails && burnParams) {
      let tx;
      setShowTransactionModal(true);
      setWaitMessage(`Burn G-UNI`);
      if (useEth && (is0Weth || is1Weth)) {
        tx = await guniRouter.removeLiquidityETH(...burnParams)
      } else {
        tx = await guniRouter.removeLiquidity(...burnParams)
      }
      setPendingTxHash(tx.hash);
      setIsTransactionPending(true);
      await reset();
      await tx.wait();
    }
  }
  const handleTryInput = async () => {
    if (account && guniPool && token0 && token1 && guniRouter) {
      setInputError(null);
      setShowDetailsModal(false);
      const details = await fetchPoolDetails(guniPool, token0, token1, account);
      setPoolDetails(details);
      if (!details) {
        setInputError('Failed to fetch pool data');
        return;
      }
      const input = inputBurn ? ethers.utils.parseUnits(inputBurn, details.decimals0.toString()) : ethers.constants.Zero;
      if (input.eq(ethers.constants.Zero)) {
        setInputError(`Must remove non-zero amount of liquidity`)
        return;
      }
      if (input.gt(details.balancePool)) {
        setInputError(`Insufficient balance of ${details.symbol}`);
        return;
      }
      if ((await guniPool.allowance(account, guniRouter.address)).gte(input)) {
        setIsApproved(true);
      }
      const burn0 = input.mul(details.supply0).div(details.supply);
      const burn1 = input.mul(details.supply1).div(details.supply);
      setExpected0(formatBigNumber(burn0, details.decimals0));
      setExpected1(formatBigNumber(burn1, details.decimals1));
      setBurnParams([guniPool.address, input, burn0.div(ethers.BigNumber.from('2')), burn1.div(ethers.BigNumber.from('2')), account]);
      setShowDetailsModal(true);
    }
  }

  useEffect(() => {
    const getPool = async () => {
      if (guniPool && token0 && token1) {
        const details = await fetchPoolDetails(guniPool, token0, token1, account);
        setPoolDetails(details);
        if (details && chainId) {
          setCurrency(new Token(chainId, guniPool.address, details.decimals, details.symbol, details.name));
        }
      }
      if (chainId) {
        if (WETH9[chainId].address == token0?.address) {
          setIs0Weth(true);
        } else if (WETH9[chainId].address == token1?.address) {
          setIs1Weth(true);
        }
      }
    }
    getPool();
  }, [guniPool, token0, token1, account, chainId]);

  const reset = async () => {
    setInputError(null);
    setInputBurn(null);
    setExpected1(null);
    setExpected0(null);
    setShowDetailsModal(false);
    if (guniPool && token0 && token1) {
      const details = await fetchPoolDetails(guniPool, token0, token1, account);
      setPoolDetails(details);
    }
  }
  return (
    <>
      {poolDetails ?
        <>
          <h2>{poolDetails.name}</h2>
          {!showDetailsModal ?
          <>
            <p>
              <strong>TVL:</strong>
              {` ${formatBigNumber(poolDetails.supply0, poolDetails.decimals0, 2)} ${poolDetails.symbol0} + ${formatBigNumber(poolDetails.supply1, poolDetails.decimals1, 2)} ${poolDetails.symbol1} `}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <strong>Supply:</strong>
              {` ${formatBigNumber(poolDetails.supply, poolDetails.decimals, 4)} ${poolDetails.symbol}`}
            </p>
            <p>
              <strong>Your Position:</strong>{` ${formatBigNumber(poolDetails.balancePool, poolDetails.decimals, 4)} ${poolDetails.symbol}`}&nbsp;&nbsp;&nbsp;{`(${formatBigNumber(poolDetails.share0, poolDetails.decimals0, 2)} ${poolDetails.symbol0} + ${formatBigNumber(poolDetails.share1, poolDetails.decimals1, 2)} ${poolDetails.symbol1})`}
            </p>
            <Area>
                <CurrencyInputPanel
                value={inputBurn ? inputBurn : ""}
                onUserInput={(e: string) => handleChangeInput(e)}
                onMax={() => setInputBurn(formatBigNumber(poolDetails.balancePool, poolDetails.decimals, poolDetails.decimals))}
                showCurrencySelector={true}
                showMaxButton={true}
                hideBalance={false}
                currency={currency}
                id={'input'}
              />
            </Area>
            <br></br>
            <Area>
              {(is0Weth || is1Weth) ?
                <>
                  Receive WETH or ETH?
                  <br></br>
                  <label className="switch">
                    <input type="checkbox" onClick={() => handleEthCheckbox()}/>
                    <div><br></br>{useEth ? 'ETH':'WETH'}</div>
                  </label>
                </>
              :
                <></>
              }
            </Area>
            <Button onClick={() => handleTryInput()}>Remove Liquidity</Button>
            {inputError ? <p style={{color: 'red'}}>{inputError}</p> : <></>}
            <br></br>
            <br></br>
            <a href={`/#/pools/add/${props.pool.address}`}>add liquidity</a>
            <a href={'/#/pools'}>all pools</a>
          </>
          : 
            <></>
          }
          <TransactionConfirmationModal content={() => (<p>hi!!!</p>)} isOpen={showTransactionModal} onDismiss={() => setShowTransactionModal(false)} hash={pendingTxHash ? pendingTxHash : undefined} attemptingTxn={!isTransactionPending} pendingText={waitMessage ? waitMessage : ''}/>
          {showDetailsModal ? 
            <Popover>
              <MarginLeft>
                <h3>Remove Liquidity</h3>
                {`Burn: ${Number(inputBurn).toFixed(5)} ${poolDetails.symbol} (${(100 * Number(inputBurn) / (Number(formatBigNumber(poolDetails.supply, poolDetails.decimals, 8)))).toFixed(3)}% of supply)`}
                <br></br>
                {`Expected Return: ${expected0} ${poolDetails.symbol0}, ${expected1} ${poolDetails.symbol1}`}<br></br>
              </MarginLeft>
              <CenteredFlex>
                {isApproved ? <ButtonLong onClick={() => handleBurn()} disabled={isTransactionPending}>{!isTransactionPending ? 'Submit Transaction' : 'Pending...'}</ButtonLong> : <ButtonLong onClick={() => handleApprove()} disabled={isTransactionPending}>{!isTransactionPending ? `Approve ${poolDetails.symbol}` : 'Pending...'}</ButtonLong>}
              </CenteredFlex>
              <br></br>
              <CenteredFlex>
                <ButtonLong onClick={() => handleCancel()}>Cancel</ButtonLong>
              </CenteredFlex>
              <br></br>
            </Popover>
          :
            <></>
          }
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
