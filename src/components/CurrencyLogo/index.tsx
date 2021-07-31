import { Currency } from '@uniswap/sdk-core'
import { useActiveWeb3React } from 'hooks/web3'
import React, { useMemo } from 'react'
import styled from 'styled-components/macro'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import useHttpLocations from '../../hooks/useHttpLocations'
import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo'
import Logo from '../Logo'
import { getBaseTokenLogoURLByTokenSymbol } from '../../constants/tokens'
import { useCombinedActiveList } from 'state/lists/hooks'

export const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
  ...rest
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) {
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)
  const { chainId } = useActiveWeb3React()

  const activeTokenList = useCombinedActiveList()

  const srcs: string[] = useMemo(() => {
    if (!currency || currency.isNative) return []

    const uriBySymbol = getBaseTokenLogoURLByTokenSymbol(currency.symbol)

    if (currency.isToken) {
      const urlFromList =
        chainId && activeTokenList[chainId][currency.address]
          ? activeTokenList[chainId][currency.address]['token']['tokenInfo']['logoURI']
          : undefined
      const defaultUrls = currency.chainId === 1 ? [getTokenLogoURL(currency.address)] : []
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, ...defaultUrls]
      }
      const tokenUrlsSoFar = uriBySymbol ? [uriBySymbol, ...defaultUrls] : defaultUrls
      return urlFromList ? ([urlFromList, ...tokenUrlsSoFar] as string[]) : (tokenUrlsSoFar as string[])
    }
    return []
  }, [currency, uriLocations, chainId, activeTokenList])
  if (currency?.symbol == "G-UNI") {
    return (<StyledLogo
      srcs={['https://i.ibb.co/sy9Dc1z/G-UNI-Logo.png']}
      size={size}
      style={style}
      {...rest}
    />)
  } else if (currency?.symbol == "ETHV" || currency?.symbol == "iETHV") {
    return (<StyledLogo
      srcs={['https://raw.githubusercontent.com/volmexfinance/assets/main/logo.png']}
      size={size}
      style={style}
      {...rest}
    />)
  }
  if (currency?.isNative) {
    return chainId !== 1 ? (
      <StyledLogo
        srcs={[getBaseTokenLogoURLByTokenSymbol(currency.symbol) ?? '']}
        size={size}
        style={style}
        {...rest}
      />
    ) : (
      <StyledEthereumLogo src={EthereumLogo} size={size} style={style} {...rest} />
    )
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />
}
