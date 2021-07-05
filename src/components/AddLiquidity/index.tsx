import React, {useEffect, useState} from 'react';
import styled from "styled-components";
import {useParams} from "react-router-dom";
import {PoolDetails, PoolParams, PoolTokens, fetchPoolDetails, formatBigNumber} from '../../components/PoolInfo';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import {
  useTokenContract,
  useGUniPoolContract,
  useGUniResolverContract,
  useGUniRouterContract,
  useUniswapV3Quoter
} from 'hooks/useContract';
import {useToken} from 'hooks/Tokens';
import { Currency, WETH9, Ether } from '@uniswap/sdk-core';
import { useActiveWeb3React } from 'hooks/web3';
//import { useTranslation } from 'react-i18next'
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
//import useUSDCPrice from 'hooks/useUSDCPrice'
import { ReactComponent as Plus } from '../../assets/images/plus-blue.svg'
//import {ethers} from 'ethers';
import './css.css';
import { ethers } from 'ethers';

const Area = styled.div`
  width: 40%;
`;

const DownArrowBackground = styled.div`
  flex-direction: row;
  flex-wrap: no-wrap;
  justify-content: center;
  align-items: center;
`

const WrappedPlus = ({ ...rest }) => <Plus {...rest} />
const ColoredWrappedPlus = styled(WrappedPlus)`
  width: 2rem;
  height: 2rem;
  position: relative;
  padding: 0.3rem;
  path {
    stroke: ${({ active }) => (active ?  '#4169e1': '#808080')};
  }
`

const MAX_UINT = ethers.BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935");

function AddLiquidityPanel(props: PoolParams) {
  const [poolDetails, setPoolDetails] = useState<PoolDetails|null>();
  const [input0, setInput0] = useState<string|null>();
  const [input1, setInput1] = useState<string|null>();
  const [inputError, setInputError] = useState<string|null>();
  const [is0Weth, setIs0Weth] = useState<boolean>(false);
  const [is1Weth, setIs1Weth] = useState<boolean>(false);
  const [isApproved0, setIsApproved0] = useState<boolean>(false);
  const [isApproved1, setIsApproved1] = useState<boolean>(false);
  const [useEth, setUseEth] = useState<boolean>(true);
  const [swapAssets, setSwapAssets] = useState<boolean>(true);
  const [eth, setEth] = useState<Currency>();
  const [expected0, setExpected0] = useState<string|null>();
  const [expected1, setExpected1] = useState<string|null>();
  const [expectedMint, setExpectedMint] = useState<BigNumber|null>();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [depositProtocol, setDepositProtocol] = useState<string|null>();
  const [depositParams, setDepositParams] = useState<any|null>();
  const [waitMessage, setWaitMessage] = useState<string|null>();
  const {chainId, account} = useActiveWeb3React();
  const guniPool = props.pool;
  const token0 = useTokenContract(props.token0);
  const token1 = useTokenContract(props.token1);
  const currency0 = useToken(props.token0);
  const currency1 = useToken(props.token1);
  const guniResolver = useGUniResolverContract();
  const quoter = useUniswapV3Quoter();
  const guniRouter = useGUniRouterContract();
  const handleChangeInput0 = (e: any) => {
    setInput0(e);
  }
  const handleChangeInput1 = (e: any) => {
    setInput1(e);
  }
  const handleRebalanceCheckbox = () => {
    setSwapAssets(!swapAssets);
  }
  const handleEthCheckbox = () => {
    setUseEth(!useEth);
  }
  const handleApprove0 = async () => {
    setWaitMessage(null);
    if (token0 && guniRouter && poolDetails) {
      const tx = await token0.approve(guniRouter.address, MAX_UINT);
      setWaitMessage(`Approving ${poolDetails.symbol0}`);
      await tx.wait();
      setWaitMessage(null);
      setIsApproved0(true);
    }
  }
  const handleApprove1 = async () => {
    setWaitMessage(null);
    if (token1 && guniRouter && poolDetails) {
      const tx = await token1.approve(guniRouter.address, MAX_UINT);
      setWaitMessage(`Approving ${poolDetails.symbol1}`);
      await tx.wait();
      setWaitMessage(null);
      setIsApproved0(true);
    }
  }
  const handleDeposit = async () => {
    console.log("EEE");
    return;
  }
  const handleTryInputs = async () => {
    if (poolDetails && account && guniPool && guniResolver && quoter && token0 && token1 && guniRouter) {
      setInputError('');
      try {
        const in0 = input0 ? ethers.utils.parseUnits(input0, poolDetails.decimals0.toString()) : ethers.constants.Zero;
        const in1 = input1 ? ethers.utils.parseUnits(input1, poolDetails.decimals1.toString()) : ethers.constants.Zero;
        if (in0.gt(poolDetails.balance0) && (!useEth || !is0Weth)){
          setInputError(`Insufficient balance of ${poolDetails.symbol0}`);
          return;
        } else if (useEth && is0Weth && in0.gt(poolDetails.balanceEth)) {
          setInputError(`Insufficient balance of ETH`);
          return;
        }
        if (in1.gt(poolDetails.balance1) && (!useEth || !is1Weth)) {
          setInputError(`Insufficient balance of ${poolDetails.symbol1}`);
          return;
        } else if (useEth && is0Weth && in1.gt(poolDetails.balanceEth)) {
          setInputError(`Insufficient balance of ETH`);
          return;
        }
        if (in0.eq(ethers.constants.Zero) && in1.eq(ethers.constants.Zero)) {
          setInputError(`Must provide non-zero amount of assets`)
          return;
        }
        if (!swapAssets && poolDetails.supply0.gt(0) && in0.eq(ethers.constants.Zero)) {
          setInputError(`Allow rebalance or provide non-zero value of ${poolDetails.symbol0}`);
          return;
        }
        if (!swapAssets && poolDetails.supply1.gt(0) && in1.eq(ethers.constants.Zero)) {
          setInputError(`Allow rebalance or provide non-zero value of ${poolDetails.symbol1}`);
          return;
        }
        if ((await token0.allowance(account, guniRouter.address)).gte(in0) || (is0Weth && useEth)) {
          setIsApproved0(true);
        }
        if ((await token1.allowance(account, guniRouter.address)).gte(in1) || (is1Weth && useEth)) {
          setIsApproved1(true);
        }
        if (!swapAssets) {
          const res = await guniPool.getMintAmounts(in0, in1);
          setExpected0(formatBigNumber(res[0], poolDetails.decimals0));
          setExpected1(formatBigNumber(res[1], poolDetails.decimals1));
          setExpectedMint(res[2]);
          setShowModal(true);
          setDepositProtocol(useEth ? 'addLiquidityETH': 'addLiquidity');
          setDepositParams([guniPool.address, in0, in1, 0, 0, account]);
        } else {
          const res = await guniResolver.getRebalanceParams(guniPool.address, in0, in1, 200);
          const [zeroForOne, swapAmount, swapThreshold] = res;
          if (swapAmount.gt(0)) {
            const pool = new ethers.Contract(await guniPool.pool(), ["function fee() external view returns (uint24)"], guniPool.provider);
            const fee = await pool.fee();
            const amountOut = await quoter.callStatic.quoteExactInputSingle(props.token0, props.token1, fee, swapAmount, swapThreshold);
            let new0;
            let new1;
            if (zeroForOne) {
              new0 = in0.sub(swapAmount);
              new1 = in1.add(amountOut);
            } else {
              new1 = in1.sub(swapAmount);
              new0 = in0.add(amountOut);
            }
            const res2 = await guniPool.getMintAmounts(new0, new1);
            setExpected0(formatBigNumber(res2[0], poolDetails.decimals0));
            setExpected1(formatBigNumber(res2[1], poolDetails.decimals1));
            setExpectedMint(res2[2]);
            setShowModal(true);
            setDepositProtocol(useEth ? 'rebalanceAndAddLiquidityETH': 'rebalanceAndAddLiquidity');
            setDepositParams([guniPool.address, in0, in1, zeroForOne, swapAmount, swapThreshold, 0, 0, account]);
          } else {
            const res2 = await guniPool.getMintAmounts(in0, in1);
            setExpected0(formatBigNumber(res2[0], poolDetails.decimals0));
            setExpected1(formatBigNumber(res2[1], poolDetails.decimals1));
            setExpectedMint(res2[2]);
            setShowModal(true);
            setDepositProtocol(useEth ? 'addLiquidityETH': 'addLiquidity');
            setDepositParams([guniPool.address, in0, in1, 0, 0, account]);
          }
        }
      } catch(e) {
        setInputError('internal error (sorry!)');
        return;
      }
    }
  }
  useEffect(() => {
    const getPool = async () => {
      if (guniPool && token0 && token1) {
        const details = await fetchPoolDetails(guniPool, token0, token1, account);
        setPoolDetails(details);
      }
      if (chainId) {
        if (WETH9[chainId].address == token0?.address) {
          setIs0Weth(true);
        } else if (WETH9[chainId].address == token1?.address) {
          setIs1Weth(true);
        }
        setEth(Ether.onChain(chainId));
      }
    }
    getPool();
  }, [guniPool, token0, token1, account, chainId]);
  return (
    <>
      {poolDetails ?
        <>
          <h2>{poolDetails.name}</h2>
          <p>
            <strong>TVL:</strong>
            {` ${formatBigNumber(poolDetails.supply0, poolDetails.decimals0, 2)} ${poolDetails.symbol0} and ${formatBigNumber(poolDetails.supply1, poolDetails.decimals1, 2)} ${poolDetails.symbol1} `}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <strong>Supply:</strong>
            {` ${formatBigNumber(poolDetails.supply, poolDetails.decimals, 4)} G-UNI`}
          </p>
          <h3>Add Liquidity:</h3>
          <Area>
            {(is0Weth && useEth) ?
                <CurrencyInputPanel
                value={input0 ? input0 : ""}
                onUserInput={(e: string) => handleChangeInput0(e)}
                showCurrencySelector={true}
                showMaxButton={false}
                hideBalance={true}
                currency={eth}
                id={'input0Eth'}
              />
            :
              <CurrencyInputPanel
                value={input0 ? input0 : ""}
                onUserInput={(e: string) => handleChangeInput0(e)}
                showCurrencySelector={true}
                showMaxButton={false}
                hideBalance={true}
                currency={currency0}
                id={'input0'}
              />
            }
          </Area>
          <DownArrowBackground>
            <ColoredWrappedPlus active={account} alt="plus" />
          </DownArrowBackground>
          <Area>
            {(is1Weth && useEth) ?
              <CurrencyInputPanel
                value={input1 ? input1 : ""}
                onUserInput={(e: string) => handleChangeInput1(e)}
                showCurrencySelector={true}
                showMaxButton={false}
                hideBalance={true}
                currency={eth}
                id={'input1Eth'}
              />
            :
              <CurrencyInputPanel
                value={input1 ? input1 : ""}
                onUserInput={(e: string) => handleChangeInput1(e)}
                showCurrencySelector={true}
                showMaxButton={false}
                hideBalance={true}
                currency={currency1}
                id={'input1'}
              />
            }
          </Area>
          <br></br>
          <Area>
            Rebalance my assets (swap) before deposit?
            <br></br>
            <label className="switch">
              <input type="checkbox" onClick={() => handleRebalanceCheckbox()}/>
              <div><br></br>{swapAssets ? 'yes':'no'}</div>
            </label>
            {(is0Weth || is1Weth) ?
              <>
                Use WETH or ETH?
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
          {inputError ? <p style={{color: 'red'}}>{inputError}</p> : <p>&nbsp;</p>}
          {!showModal ? <button onClick={() => handleTryInputs()}>Add Liquidity</button> : <></>}
          {showModal ? 
            <>
            <p>
              {expected0}<br></br>
              {expected1}<br></br>
              {expectedMint ? formatBigNumber(expectedMint, poolDetails.decimals) : "-"}
            </p>
            {isApproved0 && isApproved1 ? <button onClick={() => handleDeposit()}>Add Liquidity</button> : isApproved0 ? <button onClick={() => handleApprove1()}>{`Approve ${poolDetails.symbol1}`}</button> : <button onClick={() => handleApprove0()}>{`Approve ${poolDetails.symbol0}`}</button>}
            {waitMessage ? <p>{waitMessage}</p>: <></>}
            </>
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

export default function AddLiquidity() {
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
      {pool && poolTokens ? <AddLiquidityPanel pool={pool} token0={poolTokens.token0} token1={poolTokens.token1} /> : <></>}
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
}, [input0, currency0, usdPrice0, input1, currency1, usdPrice1, poolDetails]);*/
