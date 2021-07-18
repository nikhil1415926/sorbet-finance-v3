import React, { useState } from 'react'
import { Box, Flex } from 'rebass'
import { TYPE } from 'theme'
import DoubleLogo from 'components/DoubleLogo'

import { 
  PoolItemLayout,
  PoolItemHeader,
  LogoWrapper,
  ButtonSmall
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

  return (
    <PoolItemLayout>
      <PoolItemHeader isCollapsed={isCollapsed}>
        <LogoWrapper>
          <DoubleLogo
            currency0={currency0 || undefined}
            currency1={currency1 || undefined}
            size={28}
            margin={true}
          />
          <TYPE.heading6>{token0} / {token1}</TYPE.heading6>
        </LogoWrapper>
        <ButtonSmall>Show</ButtonSmall>
      </PoolItemHeader>
    </PoolItemLayout>
  )
}


