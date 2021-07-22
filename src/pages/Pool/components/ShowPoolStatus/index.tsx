import React, { useState, useCallback} from 'react'
import { TYPE } from 'theme'
import { RowBetween, RowFixed } from 'components/Row'
import UpArrowBtn from '../UpArrowBtn'
import GroupButton from '../GroupButton.tsx'
import { AutoColumn } from 'components/Column'
import { 
  StyledLayout,
  PanelWrapper,
  CurrentRateTextLayer,
  CurrentRateTextBox,
  CurrentRateSpliter,
  ProgressBarLayer,
  ProgressBar,
  ProgressBarTextLayer,
  ProgressBarSpliter,
  StyledQuestionHelper
} from './ShowPoolStatus.styled'


const ShowPoolStatus : React.FC = () => {
  const [isCollapsed, setCollpased] = useState<boolean>(true);
  const [viewType, setViewType] = useState<number>(0)

  const handleTogglePanel = useCallback(() => {
    setCollpased(!isCollapsed);
  }, [isCollapsed])

  const handleChangeViewType = useCallback((index: number) => {
    setViewType(index);
  }, [])

  return (
    <StyledLayout>
      <RowBetween>
        <TYPE.heading2>{isCollapsed && "Show"} Pool Status</TYPE.heading2>
        {!isCollapsed  && <GroupButton
          text1="USDC-DAI"
          text2="DAI-USDC"
          selectedIndex={viewType}
          onChange={handleChangeViewType}
        />}
        <UpArrowBtn
          isUpArrow={!isCollapsed} 
          onClick={handleTogglePanel} 
        />
      </RowBetween>
      {!isCollapsed && <PanelWrapper>
        <CurrentRateTextLayer>
          <CurrentRateTextBox>
            <CurrentRateSpliter />
            <TYPE.button2> 
              Current rate
              <br/>
              1 USDC = 1.0004 DAI
            </TYPE.button2>
          </CurrentRateTextBox>
        </CurrentRateTextLayer>
        <ProgressBarLayer>
          <div style={{backgroundColor: '#FFF'}}>
            <ProgressBar  />
          </div>
          <ProgressBarTextLayer>
            <ProgressBarSpliter />
            <RowBetween style={{margin: '0 -2px'}}>
              <TYPE.button2 style={{marginLeft: '-2px'}}> 
                0.97820 DAI
              </TYPE.button2>
              <TYPE.button2 style={{marginRight: '-5px'}}> 
                1.0045 DAI
              </TYPE.button2>
            </RowBetween>
          </ProgressBarTextLayer> 
        </ProgressBarLayer>
        <div>
          <AutoColumn gap="sm">
            <TYPE.heading2>Manager: Gelato</TYPE.heading2>
            <RowFixed>
              <TYPE.button2>Manager Fee: 0%</TYPE.button2>
              <StyledQuestionHelper
                text="Your transaction will revert if it is pending for more than this period of time." 
              />
            </RowFixed>
          </AutoColumn>
        </div>
      </PanelWrapper> }
    </StyledLayout>
  )
}

export default ShowPoolStatus