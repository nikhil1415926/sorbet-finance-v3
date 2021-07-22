import styled from 'styled-components';
import QuestionHelper from 'components/QuestionHelper'

export const StyledLayout = styled.div`
  margin-left: -20px;
  margin-right: -20px;
  padding: 20px 38px;
  background: linear-gradient(90deg, #4B3B91 0%, #CC6B8C 100%);
`
export const PanelWrapper  = styled.div`
  padding-top: 21px;
`
export const CurrentRateTextLayer = styled.div`
  display: flex;
  justify-content: flex-end;
`
export const CurrentRateTextBox = styled.div`
  display: flex;
  padding-right: 10px;
  padding-bottom: 20px;
`
export const CurrentRateSpliter = styled.hr`
  border: 1px solid #FFF;
  background: #FFF;
  margin: 3px 10px -20px 0px; 
`
export const ProgressBarLayer = styled.div`
  margin-top: -12px;
  margin-left: -18px;
  margin-right: -18px;
  padding-bottom: 20px;
  border-bottom: 0.5px solid #E5E5E5;
  margin-bottom: 20px;
`

export const ProgressBar = styled.div`
  width: 80%;
  height: 12px;
  margin: 0 auto;
  background: #FF8C89;
`
export const ProgressBarTextLayer = styled.div`
  width: 80%;
  margin: 0 auto;
`;

export const ProgressBarSpliter = styled.div`
  height: 20px;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 0.25px solid #FFFFFF;
  border-right: 0.25px solid #FFFFFF;
`;

export const StyledQuestionHelper = styled(QuestionHelper)`
  border-radius: 4px;
`
