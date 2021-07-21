import React, { Suspense } from 'react'
import { Route, Switch } from 'react-router-dom'
import styled from 'styled-components/macro'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import ErrorBoundary from '../components/ErrorBoundary'
// import PoweredByGelato from '../components/PoweredByGelato'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import LimitOrder from './LimitOrder'
import { RedirectPathToSwapOnly, RedirectToSwap } from './LimitOrder/redirects'
import { ThemedBackground } from '../theme'
import PoolRoute from './Pool/Pool.route';


const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 120px;
  align-items: center;
  flex: 1;
  z-index: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    padding-top: 6rem;
  `};
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: 2;
`

const Marginer = styled.div`
  margin-top: 5rem;
`

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Route component={GoogleAnalyticsReporter} />
        <Route component={DarkModeQueryParamReader} />
        <AppWrapper>
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          <BodyWrapper>
            <ThemedBackground />
            <Popups />
            <Polling />
            {/* <PoweredByGelato /> */}
            <Web3ReactManager>
              <Switch>
                <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
                <Route exact strict path="/swap" component={RedirectPathToSwapOnly} />
                <Route exact strict path="/limit-order/:outputCurrency" component={RedirectToSwap} />
                <Route exact strict path="/limit-order" component={LimitOrder} />

                <Route path="/pools" component={PoolRoute} />

                <Route component={RedirectPathToSwapOnly} />
              </Switch>
            </Web3ReactManager>
            <Marginer />
          </BodyWrapper>
        </AppWrapper>
      </Suspense>
    </ErrorBoundary>
  )
}
