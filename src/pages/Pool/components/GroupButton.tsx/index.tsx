import React from 'react';
import styled from 'styled-components';

interface GroupButtonProps {
  text1: string,
  text2: string,
  selectedIndex: number,
  onChange: (index: number) => void
}

const Wrapper = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  overflow: hidden;
`

const Button = styled.button<{active: boolean}>`
  background: ${({ active }) => active ? 'rgba(255, 255, 255, 0.31)': 'transparent' };
  border: none;
  padding: 8px 19px;
  color: #FFF;
  font-weight: 600;
  &:hover {
    background: rgba(255, 255, 255, 0.17);
  }
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-right: -8px;
    font-size: 13px;
  `};
`

const GroupButton : React.FC<GroupButtonProps> = ({
  text1,
  text2,
  selectedIndex,
  onChange
}: GroupButtonProps) => {
  return (
    <Wrapper>
      <Button active={0 === selectedIndex} onClick={() => onChange(0)}>{text1}</Button>
      <Button active={1 === selectedIndex} onClick={() => onChange(1)}>{text2}</Button>
    </Wrapper>
  )
};

export default GroupButton;