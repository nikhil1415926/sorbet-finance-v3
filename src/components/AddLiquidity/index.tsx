import React, {useEffect, useState} from 'react';
import styled from "styled-components";
import {useParams} from "react-router-dom";
import {PoolDetails, PoolParams, PoolTokens, fetchPoolDetails, formatBigNumber} from '../../components/PoolInfo';
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import {ButtonPink} from 'components/Button'
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
import { Contract } from '@ethersproject/contracts'
//import useUSDCPrice from 'hooks/useUSDCPrice'
//import { useTranslation } from 'react-i18next'
import { ReactComponent as Plus } from 'assets/images/plus-blue.svg';
import './toggle.css';
import { ethers } from 'ethers';

export const Area = styled.div`
  width: 40%;
`;

export const Button = styled(ButtonPink)`
  width: 25%;
`;

export const ButtonLong = styled(ButtonPink)`
  width: 50%;
`;

export const MarginLeft = styled.p`
  margin-left: 25%;
`;

export const Popover = styled.div`
  width: 50%;
  background-color: black;
  border: 2px solid #77aaff;
	box-shadow: -5px 5px #77aaff;
  color: white;
  z-index: 11;

`

export const CenteredFlex = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: no-wrap;
  justify-content: center;
  align-items: center;
  text-align: center;
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

export const MAX_UINT = ethers.BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935");

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
  const [expectedMint, setExpectedMint] = useState<string|null>();
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
    setShowModal(false);
    setInput0(e);
  }
  const handleChangeInput1 = (e: any) => {
    setShowModal(false);
    setInput1(e);
  }
  const handleRebalanceCheckbox = () => {
    setShowModal(false);
    setSwapAssets(!swapAssets);
  }
  const handleEthCheckbox = () => {
    setShowModal(false);
    setUseEth(!useEth);
  }
  const handleCancel = () => {
    setShowModal(false);
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
    setWaitMessage(null);
    if (guniRouter && poolDetails && depositParams) {
      let tx;
      if (depositProtocol == 'addLiquidity') {
        tx = await guniRouter.addLiquidity(...depositParams);
      } else if (depositProtocol == 'addLiquidityETH') {
        tx = await guniRouter.addLiquidityETH(...depositParams, {value: is0Weth ? depositParams[1]:depositParams[2]});
      } else if (depositProtocol == 'rebalanceAndAddLiquidity') {
        tx = await guniRouter.rebalanceAndAddLiquidity(...depositParams);
      } else if (depositProtocol == 'rebalanceAndAddLiquidityETH') {
        tx = await guniRouter.rebalanceAndAddLiquidityETH(...depositParams, {value: is0Weth ? depositParams[1]:depositParams[2]});
      } else {
        return;
      }
      setWaitMessage(`Minting...`);
      await tx.wait();
      setWaitMessage(null);
      await reset();
    }
  }
  const handleTryInputs = async () => {
    if (account && guniPool && guniResolver && quoter && token0 && token1 && guniRouter) {
      setInputError(null);
      setShowModal(false);
      setIsApproved0(false);
      setIsApproved1(false);
      const details = await fetchPoolDetails(guniPool, token0, token1, account);
      setPoolDetails(details);
      if (!details) {
        setInputError('Failed to fetch pool data');
        return;
      }
      try {
        const in0 = input0 ? ethers.utils.parseUnits(input0, details.decimals0.toString()) : ethers.constants.Zero;
        const in1 = input1 ? ethers.utils.parseUnits(input1, details.decimals1.toString()) : ethers.constants.Zero;
        if (in0.gt(details.balance0) && (!useEth || !is0Weth)){
          setInputError(`Insufficient balance of ${details.symbol0}`);
          return;
        } else if (useEth && is0Weth && in0.gt(details.balanceEth)) {
          setInputError(`Insufficient balance of ETH`);
          return;
        }
        if (in1.gt(details.balance1) && (!useEth || !is1Weth)) {
          setInputError(`Insufficient balance of ${details.symbol1}`);
          return;
        } else if (useEth && is0Weth && in1.gt(details.balanceEth)) {
          setInputError(`Insufficient balance of ETH`);
          return;
        }
        if (in0.eq(ethers.constants.Zero) && in1.eq(ethers.constants.Zero)) {
          setInputError(`Must provide non-zero amount of assets`)
          return;
        }
        if (!swapAssets && details.supply0.gt(0) && in0.eq(ethers.constants.Zero)) {
          setInputError(`Allow rebalance or provide non-zero value of ${details.symbol0}`);
          return;
        }
        if (!swapAssets && details.supply1.gt(0) && in1.eq(ethers.constants.Zero)) {
          setInputError(`Allow rebalance or provide non-zero value of ${details.symbol1}`);
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
          setExpected0(formatBigNumber(res[0], details.decimals0));
          setExpected1(formatBigNumber(res[1], details.decimals1));
          setExpectedMint(formatBigNumber(res[2], details.decimals));
          setDepositProtocol(useEth && (is0Weth || is1Weth) ? 'addLiquidityETH': 'addLiquidity');
          setDepositParams([guniPool.address, in0, in1, 0, 0, account]);
          setShowModal(true);
        } else {
          const res = await guniResolver.getRebalanceParams(guniPool.address, in0, in1, 200);
          const [zeroForOne, swapAmount, swapThreshold] = res;
          if (swapAmount.gt(0)) {
            const pool = new ethers.Contract(await guniPool.pool(), ["function fee() external view returns (uint24)"], guniPool.provider);
            const fee = await pool.fee();
            const path = zeroForOne ? [props.token0, props.token1] : [props.token1, props.token0];
            const amountOut = await quoter.callStatic.quoteExactInputSingle(path[0], path[1], fee, swapAmount, swapThreshold);
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
            setExpected0(formatBigNumber(res2[0], details.decimals0));
            setExpected1(formatBigNumber(res2[1], details.decimals1));
            setExpectedMint(formatBigNumber(res2[2], details.decimals));
            setDepositProtocol(useEth && (is0Weth || is1Weth) ? 'rebalanceAndAddLiquidityETH': 'rebalanceAndAddLiquidity');
            setDepositParams([guniPool.address, in0, in1, zeroForOne, swapAmount, swapThreshold, 0, 0, account]);
            setShowModal(true);
          } else {
            const res2 = await guniPool.getMintAmounts(in0, in1);
            setExpected0(formatBigNumber(res2[0], details.decimals0));
            setExpected1(formatBigNumber(res2[1], details.decimals1));
            setExpectedMint(formatBigNumber(res2[2], details.decimals));
            setDepositProtocol(useEth && (is0Weth || is1Weth) ? 'addLiquidityETH': 'addLiquidity');
            setDepositParams([guniPool.address, in0, in1, 0, 0, account]);
            setShowModal(true);
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

  const reset = async () => {
    setInputError(null);
    setWaitMessage(null);
    setIsApproved0(false);
    setIsApproved1(false);
    setShowModal(false);
    setSwapAssets(true);
    setUseEth(true);
    setInput0(null);
    setInput1(null);
    setExpected0(null);
    setExpected1(null);
    setExpectedMint(null);
    setDepositProtocol(null);
    setDepositParams(null);
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
          {!showModal ?
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
            <CenteredFlex>
              <ColoredWrappedPlus active={account} alt="plus" />
            </CenteredFlex>
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
            <Button onClick={() => handleTryInputs()}>Add Liquidity</Button>
            {inputError ? <p style={{color: 'red'}}>{inputError}</p> : <></>}
          </>
          : 
            <></>
          }
          {showModal ? 
            <Popover>
              <MarginLeft>
                <h3>Add Liquidity</h3>
                {`Max Input: ${input0 ? Number(input0).toFixed(3) : '0'} ${poolDetails.symbol0}, ${input1 ? Number(input1).toFixed(3) : '0'} ${poolDetails.symbol1}`}<br></br>
                Swap: {(swapAssets && depositParams) ? depositParams[3] ? `${formatBigNumber(depositParams[4], poolDetails.decimals0, 3)} ${poolDetails.symbol0}`: `${formatBigNumber(depositParams[4], poolDetails.decimals1, 3)} ${poolDetails.symbol1}`: 'no swap'}<br></br>
                {`Expected Deposit: ${expected0} ${poolDetails.symbol0}, ${expected1} ${poolDetails.symbol1}`}<br></br>
                {`Expected Mint: ${expectedMint} ${poolDetails.symbol} (${(100 * Number(expectedMint) / (Number(formatBigNumber(poolDetails.supply, poolDetails.decimals, 8))+Number(expectedMint))).toFixed(3)}% of supply)`}
              </MarginLeft>
              {waitMessage ? <CenteredFlex>({waitMessage})</CenteredFlex>: <CenteredFlex>&nbsp;</CenteredFlex>}
              <CenteredFlex>
                {isApproved0 && isApproved1 ? <ButtonLong onClick={() => handleDeposit()}>Submit Transaction</ButtonLong> : isApproved0 ? <ButtonLong onClick={() => handleApprove1()}>{`Approve ${poolDetails.symbol1}`}</ButtonLong> : <ButtonLong onClick={() => handleApprove0()}>{`Approve ${poolDetails.symbol0}`}</ButtonLong>}
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
