import React from "react"
import {
  Switch,
  Route,
  useRouteMatch
} from "react-router-dom"
import PoolLayout  from "./components/PoolLayout"
import PoolList from './module/PoolList';
import PoolOverview from './module/PoolOverview'
import AddLiquidity from './module/AddLiquidity'
import RemoveLiquidity from './module/RemoveLiquidity'

function PoolRoute() {
  const { path } = useRouteMatch();

  return (
    <PoolLayout>
      <Switch>
        <Route exact path={path} component={PoolList} />
        <Route exact path={`${path}/:address`} component={PoolOverview} />
        <Route exact path={`${path}/:address/add`} component={AddLiquidity} /> 
        <Route exact path={`${path}/:address/remove`} component={RemoveLiquidity} />
      </Switch>
    </PoolLayout>
  );
}

export default PoolRoute;