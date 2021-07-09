import React, {useEffect, useState} from 'react';
//import styled from "styled-components";
import {useParams} from "react-router-dom";
import {PoolDetails, PoolParams, PoolTokens, fetchPoolDetails, formatBigNumber} from '../../components/PoolInfo';
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
import { Area, Button, MarginLeft, Column, Row, Back, MAX_UINT, Input } from '../AddLiquidity'
import {Box, Title} from 'pages/Pools'
import Modal from 'components/Modal'
import '../AddLiquidity/toggle.css';
import { ethers } from 'ethers';

function RemoveLiquidityPanel(props: PoolParams) {
  const [poolDetails, setPoolDetails] = useState<PoolDetails|null>();
  const [inputBurn, setInputBurn] = useState<string|null>();
  const [inputError, setInputError] = useState<string|null>();
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const [is0Weth, setIs0Weth] = useState<boolean>(false);
  const [is1Weth, setIs1Weth] = useState<boolean>(false);
  const [useEth, setUseEth] = useState<boolean>(true);
  const [isTransactionPending, setIsTransactionPending] = useState<boolean>(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string|null>();
  const [expected0, setExpected0] = useState<string|null>();
  const [expected1, setExpected1] = useState<string|null>();
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [removeEnabled, setRemoveEnabled] = useState<boolean>(false);
  const [noInput, setNoInput] = useState<boolean>(false);
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
      setRemoveEnabled(true);
    }
  }
  const handleBurn = async () => {
    setWaitMessage(null);
    setIsTransactionPending(false);
    if (guniRouter && poolDetails && burnParams) {
      let tx;
      setShowTransactionModal(true);
      setWaitMessage(`Burn G-UNI and remove ${useEth && is0Weth ? 'ETH' : poolDetails.symbol0}/${useEth && is1Weth ? 'ETH' : poolDetails.symbol1} liquidity`);
      if (useEth && (is0Weth || is1Weth)) {
        tx = await guniRouter.removeLiquidityETH(...burnParams)
      } else {
        tx = await guniRouter.removeLiquidity(...burnParams)
      }
      setPendingTxHash(tx.hash);
      setIsTransactionPending(true);
      await reset();
      await tx.wait();
      setIsTransactionPending(false);
    }
  }
  const handleTryInput = async () => {
    if (account && guniPool && token0 && token1 && guniRouter && poolDetails) {
      setInputError(null);
      setShowDetailsModal(false);
      const input = inputBurn ? ethers.utils.parseUnits(inputBurn, poolDetails.decimals0.toString()) : ethers.constants.Zero;
      const burn0 = input.mul(poolDetails.supply0).div(poolDetails.supply);
      const burn1 = input.mul(poolDetails.supply1).div(poolDetails.supply);
      setExpected0(formatBigNumber(burn0, poolDetails.decimals0));
      setExpected1(formatBigNumber(burn1, poolDetails.decimals1));
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

  useEffect(() => {
    const checkApproval = async () => {
      if (guniRouter && account && poolDetails && guniPool) {
        let approved = false;
        setInputError(null);
        const input = inputBurn ? ethers.utils.parseUnits(inputBurn, poolDetails.decimals.toString()) : ethers.constants.Zero;
        if (input.eq(0)) {
          setRemoveEnabled(false);
          setNoInput(true);
          return
        } else {
          setNoInput(false);
        }
        if (input.gt(poolDetails.balancePool)) {
          setInputError('Insufficient G-UNI balance')
          return
        }
        if (input.lte((await guniPool.allowance(account, guniRouter.address)))) {
          approved = true;
        }
        setIsApproved(approved);
        if (approved) {
          setRemoveEnabled(true);
        }
      }
    }
    checkApproval()
  }, [inputBurn, guniPool, guniRouter, account, poolDetails]);

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
        <Box>
          <Row>
          <Title>
            {`Remove Liquidity from ${poolDetails.symbol0}/${poolDetails.symbol1} LP`}
          </Title>
          <Back href={'/#/pools'}>back</Back>
          </Row>
          <br></br>
          <Area>
              <Input
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
          {inputError ? <Area><p style={{color: 'red'}}>{inputError}</p></Area>:<Area><p>&nbsp;</p></Area>}
          <Area>
            {(isApproved || noInput) ?
              <></>
            :
              <>
              <Button onClick={() => handleApprove()} disabled={isTransactionPending}>{isTransactionPending ? 'Pending Approval...': `Approve ${poolDetails.symbol}`}</Button>
              <br></br>
              </>
            }
            <Button disabled={!removeEnabled || showDetailsModal} onClick={() => handleTryInput()}>Remove Liquidity</Button>
          </Area>
          <br></br>
          <br></br>
          <TransactionConfirmationModal content={() => (<p></p>)} isOpen={showTransactionModal} onDismiss={() => setShowTransactionModal(false)} hash={pendingTxHash ? pendingTxHash : undefined} attemptingTxn={!isTransactionPending} pendingText={waitMessage ? waitMessage : ''}/>
          {showDetailsModal ? 
            <Modal isOpen={true} onDismiss={() => handleCancel()} maxHeight={90}>
              <Column>
              <MarginLeft>
              <h2>Remove Liquidity</h2>
                {`Burn: ${Number(inputBurn).toFixed(5)} ${poolDetails.symbol} (${(100 * Number(inputBurn) / (Number(formatBigNumber(poolDetails.supply, poolDetails.decimals, 8)))).toFixed(3)}% of supply)`}
                <br></br>
                {`Est. Return: ${expected0} ${poolDetails.symbol0}, ${expected1} ${poolDetails.symbol1}`}
              </MarginLeft>
              <br></br><br></br>
              <Area>
                <Button onClick={() => handleBurn()} disabled={false}>Submit Transaction</Button>
              </Area>
              <br></br>
              <Area>
                <Button onClick={() => handleCancel()}>Cancel</Button>
              </Area>
              <br></br><br></br>
              </Column>
            </Modal>
          :
            <></>
          }
        </Box>
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
