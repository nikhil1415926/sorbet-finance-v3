import React, { useState, useCallback } from 'react'
import { TYPE } from 'theme'
import DoubleLogo from 'components/DoubleLogo'
import { ButtonSmall } from 'components/Button'
import { RowBetween, AutoRow } from 'components/Row';
import { AutoColumn } from 'components/Column';
import { 
  PoolItemLayout,
  PoolItemHeader
} from './Pooltem.styled';
import { useCurrency } from 'hooks/Tokens'
interface PoolItemProps {
  readonly token0: string
  readonly token1: string
}

export default function PoolItem({ token0, token1 }: PoolItemProps) {
  const [isCollapsed, setCollapsed] = useState<boolean>(true);

  const currency0 = useCurrency(token0);
  const currency1 = useCurrency(token1);

  const handleClick = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed])

  const buttonText = isCollapsed ? 'Show': 'Hide';

  return (
    <PoolItemLayout>
      <PoolItemHeader isCollapsed={isCollapsed} onClick={handleClick}>
        <AutoRow>
          <DoubleLogo
            currency0={currency0 || undefined}
            currency1={currency1 || undefined}
            size={28}
            margin={true}
          />
          <TYPE.heading6>{token0} / {token1}</TYPE.heading6>
        </AutoRow>
        <ButtonSmall onClick={handleClick}>{buttonText}</ButtonSmall>
      </PoolItemHeader>
      {!isCollapsed && (
        <AutoColumn 
          gap="sm"
          style={{padding: '10px 3px 16px'}}
        >
          <RowBetween>
            <TYPE.heading4>Total Value (in US Dollar)</TYPE.heading4>
            <TYPE.heading3>$ 567,657,678.88</TYPE.heading3>
          </RowBetween>
          <RowBetween>
            <TYPE.heading4>APY</TYPE.heading4>
            <TYPE.heading3>5%</TYPE.heading3>
          </RowBetween>
        </AutoColumn>
      )}
    </PoolItemLayout>
  )
}


