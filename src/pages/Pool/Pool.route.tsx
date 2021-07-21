import React from "react";
import {
  Switch,
  Route,
  useRouteMatch
} from "react-router-dom";
import PoolLayout  from "./components/PoolLayout";
import PoolList from './PoolList';
import PoolOverview from './PoolOverview';

function PoolRoute() {
  const { path } = useRouteMatch();

  return (
    <PoolLayout>
      <Switch>
        <Route exact path={path} component={PoolList} />
        <Route exact path={`${path}/view/:address`} component={PoolOverview} />
        {/* <Route exact strict path="/pools/add/:address" component={AddLiquidity} /> */}
        {/* <Route exact strict path="/pools/remove/:address" component={RemoveLiquidity} /> */}
      </Switch>
    </PoolLayout>
  );
}

export default PoolRoute;